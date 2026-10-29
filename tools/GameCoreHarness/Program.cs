using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using FateCovenant.Battle;
using FateCovenant.Game;

internal static class Program
{
    private static int passed;
    private static string root;
    private static CharacterSkillCatalog characterCatalog;

    private static int Main(string[] args)
    {
        root = Path.Combine(args[0], "run-" + DateTime.UtcNow.ToString("yyyyMMddTHHmmss") + "-" + Guid.NewGuid().ToString("N"));
        string catalogPath = args.Length > 1
            ? args[1]
            : Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,
                "../../../unity/FateCovenantClone/Assets/Resources/CharacterSkillCatalog.json"));
        characterCatalog = CharacterSkillCatalog.Parse(File.ReadAllText(catalogPath, Encoding.UTF8));
        Directory.CreateDirectory(root);
        try
        {
            Run("catalog and skill descriptions", Catalog);
            Run("complete character skill archive", CharacterArchive);
            Run("squad validation and battle input", Squad);
            Run("interrupted battle, frozen snapshot, idempotent reward", Rewards);
            Run("concurrent sessions and failed write", Concurrency);
            Run("backup recovery and damaged files", Recovery);
            Run("interrupted atomic write", InterruptedWrite);
            Run("future save and rule versions are preserved", FutureVersion);
            Run("strict input and checksum validation", InvalidData);
            Console.WriteLine("PASS: " + passed + " game-core scenarios");
            Console.WriteLine("Artifacts: " + root);
            return 0;
        }
        catch (Exception exception)
        {
            Console.WriteLine("FAIL: " + exception);
            Console.WriteLine("Artifacts: " + root);
            return 1;
        }
    }

    private static void Catalog()
    {
        GameSession session = GameSession.Open(Path.Combine(root, "catalog"));
        Check(session.Catalog.Count == 6, "Six configured characters must be registered.");
        int owned = 0;
        foreach (CharacterEntry entry in session.Catalog)
        {
            if (entry.Owned) owned++;
            Check(entry.CanDeploy == entry.Owned, "Only starter characters can deploy.");
            Check(entry.ModelStatus.Contains("pending"), "Art must not be marked complete.");
            string description = GameCatalog.DescribeSkill(entry.Definition.UltimateSkill);
            Check(description.Length > 20, "Skill description missing.");
            Check(!description.Contains("taunt") && !description.Contains("buff"), "Unimplemented skill effects must not be advertised.");
        }
        Check(owned == 3 && session.Coins == 0, "Starter profile invalid.");
        Check(GameCatalog.DescribeSkill(session.Catalog[0].Definition.BasicSkill).Contains("2.6"), "Description must use actual damage rule.");
    }

    private static void CharacterArchive()
    {
        Check(characterCatalog.Characters.Count == 337, "All 337 decoded hero records must load.");
        Check(characterCatalog.CatalogCharacters.Count == 76, "All 76 catalog-visible heroes must load.");
        GameSession session = GameSession.Open(Path.Combine(root, "archive"), characterCatalog);
        IList<CharacterEntry> archive = session.Archive;
        Check(archive.Count == 76, "The game catalog must expose every catalog-visible hero.");
        HashSet<string> skillIds = new HashSet<string>(StringComparer.Ordinal);
        for (int characterIndex = 0; characterIndex < archive.Count; characterIndex++)
        {
            CharacterEntry entry = archive[characterIndex];
            Check(!entry.Owned && !entry.CanDeploy, "Archive heroes must not become deployable by metadata alone.");
            Check(entry.Definition.Skills.Count >= 2, "Catalog heroes must retain their full skill list.");
            Check(entry.SkillStatus.Contains(entry.Definition.Skills.Count.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                "Catalog skill count must be visible in the archive.");
            for (int skillIndex = 0; skillIndex < entry.Definition.Skills.Count; skillIndex++)
            {
                SkillDefinition skill = entry.Definition.Skills[skillIndex];
                skillIds.Add(skill.Id);
                Check(GameCatalog.DescribeSkill(skill).Length > 0, "Every archive skill needs a displayable description.");
            }
        }
        Check(skillIds.Count == 530, "The archive must retain all 530 visible unique skills.");
    }

    private static void Squad()
    {
        GameSession session = GameSession.Open(Path.Combine(root, "squad"));
        string original = Join(session.Squad);
        Throws<ArgumentException>(delegate { session.SetSquad(new[] { "ally_blade", "ally_blade", "ally_sprout" }); });
        Throws<ArgumentException>(delegate { session.SetSquad(new[] { "ally_blade", "ally_sprout" }); });
        Throws<ArgumentException>(delegate { session.SetSquad(new[] { "ally_blade", "ally_sprout", "enemy_axe" }); });
        Throws<ArgumentException>(delegate { session.SetSquad(new[] { "ally_blade", "ally_sprout", "unknown" }); });
        Check(Join(session.Squad) == original, "Rejected squad changed profile.");
        IList<string> exposed = session.Squad;
        Throws<NotSupportedException>(delegate { exposed[0] = "bad"; });
        BattleResult baseline = new BattleSimulator(BattleCatalog.CreateAllies(), BattleCatalog.CreateEnemies(), 12345).Run();
        session.SetSquad(new[] { "ally_bulwark", "ally_blade", "ally_sprout" });
        BattleRun run = session.BeginBattle();
        Check(run.Allies[0].Id == "ally_bulwark", "Squad order did not reach simulation.");
        Check(Events(run.Result) != Events(baseline), "Changed front slot must influence initial target selection.");
        Check(GameSession.Open(Path.Combine(root, "squad")).Squad[0] == "ally_bulwark", "Squad was not saved.");
    }

    private static void Rewards()
    {
        string path = Path.Combine(root, "rewards");
        GameSession session = GameSession.Open(path);
        BattleRun original = session.BeginBattle();
        string events = Events(original.Result);
        Check(original.Seed == 12345 && original.Result.Victory, "First battle should use deterministic starter seed.");
        Check(session.BeginBattle().TicketId == original.TicketId, "Repeated start created another pending battle.");
        session.SetSquad(new[] { "ally_sprout", "ally_bulwark", "ally_blade" });
        session = GameSession.Open(path);
        Check(session.HasPendingBattle && Events(session.GetPendingBattle().Result) == events, "Restart changed frozen battle.");
        Check(session.GetPendingBattle().Allies[0].Id == "ally_blade", "Editing squad changed pending snapshot.");
        Throws<ArgumentException>(delegate { session.ClaimReward("forged-ticket"); });
        original.Result.Events.Clear();
        RewardClaim first = session.ClaimReward(original.TicketId);
        Check(first.Granted && first.Coins == 100 && first.Victory, "Victory reward missing.");
        Check(!session.ClaimReward(original.TicketId).Granted && session.Coins == 100, "Repeated claim paid twice.");
        session = GameSession.Open(path);
        Check(!session.HasPendingBattle && session.CompletedBattles == 1 && session.Coins == 100, "Settlement was not persisted.");
        Check(!session.ClaimReward(original.TicketId).Granted, "Restart allowed duplicate reward.");
        BattleRun next = session.BeginBattle();
        Check(next.TicketId != original.TicketId && next.Seed != original.Seed, "Next challenge reused a ticket.");
        Check(next.Allies[0].Id == "ally_sprout", "Next battle ignored saved squad.");
        session.ClaimReward(next.TicketId);
        Check(session.CompletedBattles == 2 && session.Coins <= 200, "Repeated challenge failed.");
        Throws<ArgumentException>(delegate { session.ClaimReward(original.TicketId); });
    }

    private static void Concurrency()
    {
        string path = Path.Combine(root, "concurrency");
        GameSession first = GameSession.Open(path);
        GameSession stale = GameSession.Open(path);
        first.BeginBattle();
        Throws<IOException>(delegate { stale.SetSquad(new[] { "ally_sprout", "ally_blade", "ally_bulwark" }); });
        Check(stale.Squad[0] == "ally_blade", "Failed write changed in-memory state.");
        GameSession live = GameSession.Open(path);
        using (FileStream held = new FileStream(live.SavePath + ".lock", FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
        {
            Throws<IOException>(delegate { live.ClaimReward(live.GetPendingBattle().TicketId); });
            Check(live.Coins == 0 && live.HasPendingBattle, "Failed settlement changed in-memory resources.");
        }
        live.ClaimReward(live.GetPendingBattle().TicketId);
        Check(live.Coins == 100, "Retry after I/O failure did not settle.");
    }

    private static void Recovery()
    {
        string path = Path.Combine(root, "recovery");
        GameSession session = GameSession.Open(path);
        BattleRun run = session.BeginBattle();
        session.ClaimReward(run.TicketId);
        session.Save();
        File.WriteAllText(session.SavePath, "truncated");
        session = GameSession.Open(path);
        Check(session.RecoveryNotice.Length > 0 && session.Coins == 100, "Valid backup did not restore resources.");
        Check(!session.ClaimReward(run.TicketId).Granted, "Recovered receipt allowed duplicate settlement.");
        Check(Directory.GetFiles(path, "*.damaged-*").Length > 0, "Damaged source was not preserved.");
        File.WriteAllText(session.SavePath, "bad-main");
        File.WriteAllText(session.SavePath + ".bak", "bad-backup");
        session = GameSession.Open(path);
        Check(session.Coins == 0 && session.Squad.Count == 3 && session.RecoveryNotice.Length > 0, "Total corruption did not recover a starter profile.");
        Check(Directory.GetFiles(path, "*.damaged-*").Length >= 3, "Corrupted backup evidence was overwritten.");

        string rollbackPath = Path.Combine(root, "settlement-rollback");
        session = GameSession.Open(rollbackPath);
        run = session.BeginBattle();
        session.ClaimReward(run.TicketId);
        File.WriteAllText(session.SavePath, "lost-settlement-write");
        session = GameSession.Open(rollbackPath);
        Check(session.HasPendingBattle && session.Coins == 0, "Backup should restore the pre-settlement ticket.");
        session.ClaimReward(run.TicketId);
        Check(session.Coins == 100 && !session.ClaimReward(run.TicketId).Granted, "Recovered pending ticket settled incorrectly.");
    }

    private static void InterruptedWrite()
    {
        string path = Path.Combine(root, "interrupted");
        GameSession session = GameSession.Open(path);
        SaveState next = SaveCodec.Decode(File.ReadAllText(session.SavePath));
        next.Revision++;
        next.Squad = new List<string>(new[] { "ally_bulwark", "ally_sprout", "ally_blade" });
        File.WriteAllText(session.SavePath + ".next", SaveCodec.Encode(next), new UTF8Encoding(false));
        session = GameSession.Open(path);
        Check(session.Squad[0] == "ally_bulwark" && session.RecoveryNotice.Length > 0, "Durable interrupted write was ignored.");
        File.WriteAllText(session.SavePath + ".next", "incomplete");
        session = GameSession.Open(path);
        Check(session.Squad[0] == "ally_bulwark", "Incomplete staging file destroyed valid primary.");
    }

    private static void FutureVersion()
    {
        string path = Path.Combine(root, "future");
        GameSession session = GameSession.Open(path);
        session.Save();
        string payload = File.ReadAllText(session.SavePath).Replace("version=1\n", "version=2\n");
        File.WriteAllText(session.SavePath, payload, new UTF8Encoding(false));
        Throws<UnsupportedSaveVersionException>(delegate { GameSession.Open(path); });
        Check(File.ReadAllText(session.SavePath) == payload, "Future version was silently overwritten.");
        string rulesPath = Path.Combine(root, "future-rules");
        session = GameSession.Open(rulesPath);
        session.BeginBattle();
        string ruleSave = File.ReadAllText(session.SavePath);
        string changed = Rechecksum(ruleSave.Replace("pending_rules=" + GameCatalog.RulesVersion + "\n", "pending_rules=prototype-v99\n"));
        File.WriteAllText(session.SavePath, changed, new UTF8Encoding(false));
        Throws<NotSupportedException>(delegate { GameSession.Open(rulesPath); });
        Check(File.ReadAllText(session.SavePath) == changed, "Unsupported battle rules were overwritten.");
    }

    private static void InvalidData()
    {
        GameSession session = GameSession.Open(Path.Combine(root, "validation"));
        string text = File.ReadAllText(session.SavePath);
        Throws<InvalidDataException>(delegate { SaveCodec.Decode(text.Replace("coins=0", "coins=100000")); });
        Throws<InvalidDataException>(delegate { SaveCodec.Decode(Rechecksum(text.Replace("coins=0", "coins=100000"))); });
        Throws<InvalidDataException>(delegate { SaveCodec.Decode(Rechecksum(text.Replace("squad=ally_blade,ally_sprout,ally_bulwark", "squad=ally_blade,ally_blade,ally_sprout"))); });
        Throws<InvalidDataException>(delegate { SaveCodec.Decode(text + "unknown=true\n"); });
    }

    private static string Rechecksum(string text)
    {
        string body = text.Substring(0, text.IndexOf("checksum=", StringComparison.Ordinal));
        using (System.Security.Cryptography.SHA256 hash = System.Security.Cryptography.SHA256.Create())
            return body + "checksum=" + BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(body))).Replace("-", string.Empty).ToLowerInvariant() + "\n";
    }

    private static string Join(IList<string> ids) { return string.Join(",", new List<string>(ids).ToArray()); }
    private static string Events(BattleResult result)
    {
        StringBuilder text = new StringBuilder();
        foreach (BattleEvent battleEvent in result.Events) text.AppendLine(battleEvent.ToString());
        return text.ToString();
    }
    private static void Run(string name, Action action) { action(); passed++; Console.WriteLine("PASS " + name); }
    private static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
    private static void Throws<T>(Action action) where T : Exception
    {
        try { action(); }
        catch (T) { return; }
        throw new Exception("Expected " + typeof(T).Name);
    }
}
