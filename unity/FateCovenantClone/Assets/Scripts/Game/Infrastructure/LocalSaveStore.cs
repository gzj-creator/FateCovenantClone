using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace FateCovenant.Game
{
    public sealed class UnsupportedSaveVersionException : NotSupportedException
    {
        public UnsupportedSaveVersionException(int version)
            : base("Save version " + version + " is unsupported. Preserve this save and open it with a compatible build.") { }
    }

    internal sealed class LocalSaveStore
    {
        private readonly string directory;
        public string SavePath { get { return Path.Combine(directory, "profile.fcsave"); } }
        private string BackupPath { get { return SavePath + ".bak"; } }
        private string StagingPath { get { return SavePath + ".next"; } }

        public LocalSaveStore(string directory)
        {
            if (string.IsNullOrEmpty(directory)) throw new ArgumentException("A save directory is required.", "directory");
            this.directory = Path.GetFullPath(directory);
            Directory.CreateDirectory(this.directory);
        }

        public SaveState Load(out string notice)
        {
            using (FileStream saveLock = Lock())
            {
                return LoadUnlocked(out notice);
            }
        }

        private SaveState LoadUnlocked(out string notice)
        {
            SaveState best = null;
            string bestPath = null;
            bool sawInvalid = false;
            foreach (string path in new[] { SavePath, StagingPath, BackupPath })
            {
                if (!File.Exists(path)) continue;
                try
                {
                    SaveState candidate = SaveCodec.Decode(File.ReadAllText(path, Encoding.UTF8));
                    if (best == null || candidate.Revision > best.Revision) { best = candidate; bestPath = path; }
                }
                catch (InvalidDataException) { sawInvalid = true; }
            }
            if (best == null)
            {
                notice = sawInvalid ? "Save and backup were damaged. A fresh starter profile was created; damaged files are preserved." : string.Empty;
                return new SaveState();
            }
            notice = bestPath != SavePath ? "Recovered the latest valid profile from a backup or interrupted write."
                : sawInvalid ? "Loaded valid profile; a damaged redundant save was ignored." : string.Empty;
            return best;
        }

        public void Write(SaveState candidate, long expectedRevision)
        {
            string payload = SaveCodec.Encode(candidate);
            using (FileStream saveLock = Lock())
            {
                string notice;
                SaveState disk = LoadUnlocked(out notice);
                if (disk.Revision != expectedRevision)
                    throw new IOException("Profile changed in another session. Reopen it before saving.");
                foreach (string path in new[] { SavePath, StagingPath, BackupPath })
                {
                    if (!File.Exists(path)) continue;
                    try { SaveCodec.Decode(File.ReadAllText(path, Encoding.UTF8)); }
                    catch (InvalidDataException)
                    {
                        File.Move(path, path + ".damaged-" + Guid.NewGuid().ToString("N"));
                    }
                }

                byte[] bytes = new UTF8Encoding(false).GetBytes(payload);
                using (FileStream stream = new FileStream(StagingPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    stream.Write(bytes, 0, bytes.Length);
                    stream.Flush(true);
                }
                if (File.Exists(SavePath))
                {
                    File.Replace(StagingPath, SavePath, BackupPath);
                }
                else
                {
                    File.Move(StagingPath, SavePath);
                }
            }
        }

        private FileStream Lock()
        {
            return new FileStream(SavePath + ".lock", FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None);
        }
    }

    // A deliberately small, versioned record format; this is not a general JSON parser.
    internal static class SaveCodec
    {
        private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;
        private static readonly string[] Keys = { "version", "revision", "profile", "coins", "completed", "next",
            "owned", "squad", "pending_ticket", "pending_seed", "pending_rules", "pending_allies", "pending_enemies",
            "receipt_ticket", "receipt_coins", "receipt_victory" };

        public static string Encode(SaveState state)
        {
            Validate(state);
            PendingBattle pending = state.Pending;
            RewardReceipt receipt = state.Receipt;
            string[] values = { "1", state.Revision.ToString(Invariant), state.ProfileId, state.Coins.ToString(Invariant),
                state.Completed.ToString(Invariant), state.NextBattle.ToString(Invariant), string.Join(",", state.Owned.ToArray()),
                string.Join(",", state.Squad.ToArray()), pending == null ? "-" : pending.TicketId,
                pending == null ? "0" : pending.Seed.ToString(Invariant), pending == null ? "-" : pending.Rules,
                pending == null ? "-" : string.Join(",", pending.Allies.ToArray()),
                pending == null ? "-" : string.Join(",", pending.Enemies.ToArray()),
                receipt == null ? "-" : receipt.TicketId, receipt == null ? "0" : receipt.Coins.ToString(Invariant),
                receipt != null && receipt.Victory ? "1" : "0" };
            StringBuilder body = new StringBuilder("FATE_COVENANT_SAVE\n");
            for (int i = 0; i < Keys.Length; i++) body.Append(Keys[i]).Append('=').Append(values[i]).Append('\n');
            return body.ToString() + "checksum=" + Hash(body.ToString()) + "\n";
        }

        public static SaveState Decode(string text)
        {
            if (text == null || text.Length > 65536) throw new InvalidDataException("Invalid save size.");
            string[] lines = text.Split('\n');
            if (lines.Length < 3 || lines[0] != "FATE_COVENANT_SAVE" || !lines[1].StartsWith("version=", StringComparison.Ordinal))
                throw new InvalidDataException("Invalid save header.");
            int version = Integer(lines[1].Substring(8));
            if (version != 1) throw new UnsupportedSaveVersionException(version);
            if (lines.Length != Keys.Length + 3 || lines[lines.Length - 1] != string.Empty)
                throw new InvalidDataException("Invalid save record count.");
            string[] values = new string[Keys.Length];
            StringBuilder body = new StringBuilder(lines[0] + "\n");
            for (int i = 0; i < Keys.Length; i++)
            {
                string prefix = Keys[i] + "=";
                if (!lines[i + 1].StartsWith(prefix, StringComparison.Ordinal)) throw new InvalidDataException("Unexpected save field.");
                values[i] = lines[i + 1].Substring(prefix.Length);
                body.Append(lines[i + 1]).Append('\n');
            }
            if (lines[Keys.Length + 1] != "checksum=" + Hash(body.ToString())) throw new InvalidDataException("Save checksum mismatch.");
            long revision;
            if (!long.TryParse(values[1], NumberStyles.None, Invariant, out revision)) throw new InvalidDataException("Invalid revision.");
            SaveState state = new SaveState { Revision = revision, ProfileId = values[2], Coins = Integer(values[3]),
                Completed = Integer(values[4]), NextBattle = Integer(values[5]), Owned = Ids(values[6]), Squad = Ids(values[7]) };
            if (values[8] != "-")
                state.Pending = new PendingBattle { TicketId = values[8], Seed = Integer(values[9]), Rules = values[10],
                    Allies = Ids(values[11]), Enemies = Ids(values[12]) };
            else if (values[9] != "0" || values[10] != "-" || values[11] != "-" || values[12] != "-")
                throw new InvalidDataException("Inconsistent empty pending battle.");
            if (values[13] != "-")
            {
                if (values[15] != "0" && values[15] != "1") throw new InvalidDataException("Invalid victory field.");
                state.Receipt = new RewardReceipt { TicketId = values[13], Coins = Integer(values[14]), Victory = values[15] == "1" };
            }
            else if (values[14] != "0" || values[15] != "0") throw new InvalidDataException("Inconsistent empty receipt.");
            Validate(state);
            return state;
        }

        private static void Validate(SaveState state)
        {
            Guid profile;
            if (state == null || !Guid.TryParseExact(state.ProfileId, "N", out profile) || state.Revision < 0
                || state.Completed < 0 || state.NextBattle < 1 || state.NextBattle > int.MaxValue - 12344
                || state.Coins < 0 || state.Coins % GameCatalog.VictoryCoins != 0
                || (long)state.Coins > (long)state.Completed * GameCatalog.VictoryCoins)
                throw new InvalidDataException("Invalid profile values.");
            if ((long)state.NextBattle != (long)state.Completed + (state.Pending == null ? 1 : 2))
                throw new InvalidDataException("Invalid battle sequence.");
            try
            {
                List<string> starter = GameCatalog.StarterIds();
                if (state.Owned == null || state.Owned.Count != 3 || new HashSet<string>(state.Owned).Count != 3)
                    throw new ArgumentException("Invalid ownership.");
                foreach (string id in state.Owned) if (!starter.Contains(id)) throw new ArgumentException("Unknown owned character.");
                GameSession.ValidateSquad(state.Squad, state.Owned);
                if (state.Pending != null)
                {
                    PendingBattle p = state.Pending;
                    if (p.Rules != GameCatalog.RulesVersion) throw new NotSupportedException("Pending battle rules are unsupported: " + p.Rules);
                    GameSession.ValidateSquad(p.Allies, state.Owned);
                    if (p.TicketId != Ticket(state, state.NextBattle - 1) || p.Seed != 12344 + state.NextBattle - 1
                        || p.Enemies == null || string.Join(",", p.Enemies.ToArray()) != string.Join(",", GameCatalog.EnemyIds().ToArray()))
                        throw new ArgumentException("Invalid pending snapshot.");
                }
            }
            catch (ArgumentException exception) { throw new InvalidDataException("Invalid roster or battle snapshot.", exception); }
            if (state.Completed == 0 && state.Receipt != null || state.Completed > 0 && state.Receipt == null)
                throw new InvalidDataException("Missing or unexpected reward receipt.");
            if (state.Receipt != null && (state.Receipt.TicketId != Ticket(state, state.Completed)
                || state.Receipt.Coins != (state.Receipt.Victory ? GameCatalog.VictoryCoins : 0)))
                throw new InvalidDataException("Invalid reward receipt.");
        }

        private static string Ticket(SaveState state, int sequence)
        {
            return state.ProfileId + "-" + sequence.ToString(Invariant);
        }

        private static int Integer(string value)
        {
            int result;
            if (!int.TryParse(value, NumberStyles.None, Invariant, out result)) throw new InvalidDataException("Invalid integer field.");
            return result;
        }

        private static List<string> Ids(string value)
        {
            return new List<string>(value.Split(','));
        }

        private static string Hash(string payload)
        {
            using (SHA256 hash = SHA256.Create())
                return BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(payload))).Replace("-", string.Empty).ToLowerInvariant();
        }
    }
}
