using System;
using System.Collections.Generic;
using System.Globalization;
using FateCovenant.Battle;

namespace FateCovenant.Game
{
    public sealed class BattleRun
    {
        public readonly string TicketId;
        public readonly string StageId;
        public readonly int Seed;
        public readonly IList<CharacterDefinition> Allies;
        public readonly IList<CharacterDefinition> Enemies;
        public readonly BattleResult Result;

        internal BattleRun(PendingBattle pending)
        {
            if (pending.Rules != GameCatalog.RulesVersion)
                throw new InvalidOperationException("Pending battle uses unsupported rules: " + pending.Rules);
            TicketId = pending.TicketId;
            StageId = GameCatalog.StageId;
            Seed = pending.Seed;
            Allies = GameCatalog.Resolve(pending.Allies, true);
            Enemies = GameCatalog.Resolve(pending.Enemies, false);
            Result = new BattleSimulator(Allies, Enemies, Seed).Run();
        }
    }

    public sealed class RewardClaim
    {
        public readonly bool Granted;
        public readonly int Coins;
        public readonly bool Victory;

        internal RewardClaim(bool granted, int coins, bool victory)
        {
            Granted = granted;
            Coins = coins;
            Victory = victory;
        }
    }

    public sealed class GameSession
    {
        private readonly LocalSaveStore store;
        private readonly IList<CharacterEntry> archive;
        private SaveState state;
        public string RecoveryNotice { get; private set; }
        public IList<CharacterEntry> Catalog { get { return GameCatalog.Create(state.Owned); } }
        public IList<CharacterEntry> Archive { get { return archive; } }
        public IList<string> Squad { get { return new List<string>(state.Squad).AsReadOnly(); } }
        public int Coins { get { return state.Coins; } }
        public int CompletedBattles { get { return state.Completed; } }
        public bool HasPendingBattle { get { return state.Pending != null; } }
        public string SavePath { get { return store.SavePath; } }

        private GameSession(LocalSaveStore store, SaveState state, string notice, CharacterSkillCatalog skillCatalog)
        {
            this.store = store;
            this.state = state;
            RecoveryNotice = notice;
            archive = skillCatalog == null
                ? GameCatalog.Create(state.Owned)
                : GameCatalog.CreateArchive(skillCatalog, state.Owned);
        }

        public static GameSession Open(string directory, CharacterSkillCatalog skillCatalog = null)
        {
            LocalSaveStore store = new LocalSaveStore(directory);
            string notice;
            SaveState loaded = store.Load(out notice);
            GameSession session = new GameSession(store, loaded, notice, skillCatalog);
            if (loaded.Revision == 0 || notice.Length > 0) session.Save();
            return session;
        }

        public void SetSquad(IList<string> ids)
        {
            ValidateSquad(ids, state.Owned);
            SaveState candidate = state.Clone();
            candidate.Squad = new List<string>(ids);
            Commit(candidate);
        }

        public BattleRun BeginBattle()
        {
            if (state.Pending != null) return new BattleRun(state.Pending);
            ValidateSquad(state.Squad, state.Owned);
            SaveState candidate = state.Clone();
            PendingBattle pending = new PendingBattle();
            pending.TicketId = state.ProfileId + "-" + state.NextBattle.ToString(CultureInfo.InvariantCulture);
            pending.Seed = checked(12344 + state.NextBattle);
            pending.Rules = GameCatalog.RulesVersion;
            pending.Allies = new List<string>(state.Squad);
            pending.Enemies = GameCatalog.EnemyIds();
            candidate.NextBattle = checked(candidate.NextBattle + 1);
            candidate.Pending = pending;
            BattleRun run = new BattleRun(pending);
            Commit(candidate);
            return run;
        }

        public BattleRun GetPendingBattle()
        {
            return state.Pending == null ? null : new BattleRun(state.Pending);
        }

        public RewardClaim ClaimReward(string ticketId)
        {
            if (string.IsNullOrEmpty(ticketId)) throw new ArgumentException("A battle ticket is required.", "ticketId");
            if (state.Receipt != null && state.Receipt.TicketId == ticketId)
                return new RewardClaim(false, state.Receipt.Coins, state.Receipt.Victory);
            if (state.Pending == null || state.Pending.TicketId != ticketId)
                throw new ArgumentException("Ticket does not match the pending battle.", "ticketId");

            // Recompute the frozen ticket; caller-supplied presentation results cannot mint rewards.
            BattleRun run = new BattleRun(state.Pending);
            int coins = run.Result.Victory ? GameCatalog.VictoryCoins : 0;
            SaveState candidate = state.Clone();
            candidate.Coins = checked(candidate.Coins + coins);
            candidate.Completed = checked(candidate.Completed + 1);
            candidate.Receipt = new RewardReceipt { TicketId = ticketId, Coins = coins, Victory = run.Result.Victory };
            candidate.Pending = null;
            Commit(candidate);
            return new RewardClaim(true, coins, run.Result.Victory);
        }

        public void Save()
        {
            Commit(state.Clone());
        }

        private void Commit(SaveState candidate)
        {
            candidate.Revision = checked(state.Revision + 1);
            store.Write(candidate, state.Revision);
            state = candidate;
        }

        internal static void ValidateSquad(IList<string> ids, IList<string> owned)
        {
            if (ids == null || ids.Count != 3) throw new ArgumentException("Squad must contain exactly three characters.", "ids");
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            IList<string> deployable = GameCatalog.StarterIds();
            foreach (string id in ids)
            {
                if (id == null || !seen.Add(id)) throw new ArgumentException("Squad contains a missing or duplicate character.", "ids");
                if (!owned.Contains(id) || !deployable.Contains(id))
                    throw new ArgumentException("Character is unknown, unowned or not deployable: " + id, "ids");
            }
        }
    }

    internal sealed class SaveState
    {
        public long Revision;
        public string ProfileId = Guid.NewGuid().ToString("N");
        public int Coins;
        public int Completed;
        public int NextBattle = 1;
        public List<string> Owned = GameCatalog.StarterIds();
        public List<string> Squad = GameCatalog.StarterIds();
        public PendingBattle Pending;
        public RewardReceipt Receipt;

        public SaveState Clone()
        {
            return new SaveState { Revision = Revision, ProfileId = ProfileId, Coins = Coins, Completed = Completed,
                NextBattle = NextBattle, Owned = new List<string>(Owned), Squad = new List<string>(Squad),
                Pending = Pending == null ? null : Pending.Clone(),
                Receipt = Receipt == null ? null : new RewardReceipt { TicketId = Receipt.TicketId, Coins = Receipt.Coins, Victory = Receipt.Victory } };
        }
    }

    internal sealed class PendingBattle
    {
        public string TicketId;
        public int Seed;
        public string Rules;
        public List<string> Allies;
        public List<string> Enemies;

        public PendingBattle Clone()
        {
            return new PendingBattle { TicketId = TicketId, Seed = Seed, Rules = Rules,
                Allies = new List<string>(Allies), Enemies = new List<string>(Enemies) };
        }
    }

    internal sealed class RewardReceipt
    {
        public string TicketId;
        public int Coins;
        public bool Victory;
    }
}
