using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using FateCovenant.Battle;
using FateCovenant.Game;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace FateCovenant.Presentation
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        public static GameBootstrap Instance { get; private set; }
        public GameSession Session { get; private set; }
        public bool BattlePlaying { get; private set; }
        public bool ResultVisible { get; private set; }
        public int PresentedEvents { get; private set; }
        public int SkillCues { get; private set; }
        public string LastError { get; private set; }
        public BattleRun CurrentBattle { get; private set; }
        public IList<ProceduralActor> Actors { get { return new List<ProceduralActor>(actors.Values).AsReadOnly(); } }

        private Canvas canvas;
        private RectTransform safe, page, healthLayer;
        private ArenaView arena;
        private readonly Dictionary<string, ProceduralActor> actors = new Dictionary<string, ProceduralActor>();
        private readonly Dictionary<string, RectTransform> bars = new Dictionary<string, RectTransform>();
        private readonly Dictionary<string, Image> fills = new Dictionary<string, Image>();
        private readonly Dictionary<string, Text> hpLabels = new Dictionary<string, Text>();
        private Text roundLabel, actionLabel, speedLabel;
        private RectTransform cutIn;
        private Coroutine playback;
        private float speed = 1;
        private bool muted, catalogOwnedOnly;
        private string selectedId = "ally_blade";
        private string view = "Main";
        private int selectedSlot, catalogCharacterPage, catalogSkillPage;
        private float previewYaw;
        private ProceduralActor actingActor;
        private Vector2 previousPointer;
        private Rect lastSafeArea;
        private int lastWidth, lastHeight;
        private readonly Dictionary<string, int> allyDamage = new Dictionary<string, int>();

        private void Awake()
        {
            if (Instance && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Application.targetFrameRate = 60;
            Screen.orientation = ScreenOrientation.Portrait;
            SceneManager.sceneLoaded += SceneLoaded;
            try
            {
                TextAsset catalogAsset = Resources.Load<TextAsset>("CharacterSkillCatalog");
                if (!catalogAsset) throw new InvalidOperationException("CharacterSkillCatalog resource is missing.");
                CharacterSkillCatalog skillCatalog = CharacterSkillCatalog.Parse(catalogAsset.text);
                string smokeSave = Environment.GetEnvironmentVariable("FATE_SMOKE_SAVE");
                Session = GameSession.Open(string.IsNullOrEmpty(smokeSave)
                    ? Path.Combine(Application.persistentDataPath, "profile") : smokeSave, skillCatalog);
            }
            catch (Exception exception) { LastError = exception.Message; Debug.LogException(exception); }
        }

        private void Start()
        {
            if (Instance != this) return;
            SceneManager.LoadScene("Main");
        }

        private void SceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (Instance != this) return;
            BuildCanvas();
            if (Session == null) { ShowFatal(); return; }
            if (scene.name == "Battle") BuildBattle();
            else ShowMain();
        }

        private void BuildCanvas()
        {
            if (canvas) Destroy(canvas.gameObject);
            GameObject root = new GameObject("Interface", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvas = root.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = root.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080, 1920);
            scaler.matchWidthOrHeight = 0;
            safe = UiFactory.Rect("Safe area", root.transform, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            UpdateSafeArea();
            if (!FindFirstObjectByType<EventSystem>())
                new GameObject("Event system", typeof(EventSystem), typeof(StandaloneInputModule));
        }

        private void UpdateSafeArea()
        {
            lastSafeArea = Screen.safeArea; lastWidth = Screen.width; lastHeight = Screen.height;
            safe.anchorMin = new Vector2(lastSafeArea.xMin / Screen.width, lastSafeArea.yMin / Screen.height);
            safe.anchorMax = new Vector2(lastSafeArea.xMax / Screen.width, lastSafeArea.yMax / Screen.height);
        }

        private void Update()
        {
            if (!safe) return;
            if (lastSafeArea != Screen.safeArea || lastWidth != Screen.width || lastHeight != Screen.height) UpdateSafeArea();
            if (Input.GetKeyDown(KeyCode.Escape) && !BattlePlaying && view != "Main") ShowMain();
            if (view == "Catalog" || view == "Main")
            {
                Vector2 pointer = Input.mousePosition;
                if (Input.GetMouseButtonDown(0)) previousPointer = pointer;
                if (Input.GetMouseButton(0) && pointer.y > Screen.height * 0.4f && pointer.y < Screen.height * 0.82f
                    && (!EventSystem.current || !EventSystem.current.IsPointerOverGameObject()))
                {
                    previewYaw += (pointer.x - previousPointer.x) * 0.25f;
                    foreach (ProceduralActor actor in actors.Values) actor.transform.rotation = Quaternion.Euler(0, previewYaw, 0);
                }
                previousPointer = pointer;
            }
            if (view == "Battle" && arena)
            {
                foreach (KeyValuePair<string, RectTransform> pair in bars)
                {
                    ProceduralActor actor = actors[pair.Key];
                    Vector2 local;
                    Vector3 screen = arena.Camera.WorldToScreenPoint(actor.transform.position + Vector3.up * 2.55f);
                    RectTransformUtility.ScreenPointToLocalPointInRectangle(safe, screen, null, out local);
                    pair.Value.anchoredPosition = local;
                }
            }
        }

        private void ClearPage(string nextView, bool battle = false)
        {
            StopAllCoroutines(); playback = null; actingActor = null;
            view = nextView;
            if (page) { page.gameObject.SetActive(false); Destroy(page.gameObject); }
            if (arena) { arena.gameObject.SetActive(false); Destroy(arena.gameObject); }
            foreach (ProceduralActor actor in actors.Values) if (actor) { actor.gameObject.SetActive(false); Destroy(actor.gameObject); }
            actors.Clear(); bars.Clear(); fills.Clear(); hpLabels.Clear();
            page = UiFactory.Rect(nextView, safe, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            arena = ArenaView.Create(battle);
            if (!battle) arena.Camera.rect = new Rect(0, 0.34f, 1, 0.56f);
        }

        private void Header(string title, string subtitle)
        {
            RectTransform header = UiFactory.Band("Header", page, 0, 215, 0, 0);
            UiFactory.Fill(header, UiFactory.Ink);
            UiFactory.Label(UiFactory.Band("Eyebrow", header, 25, 34), "FATE / COVENANT", 23, UiFactory.Mint);
            UiFactory.Label(UiFactory.Band("Title", header, 70, 70), title, 48, UiFactory.Paper);
            UiFactory.Label(UiFactory.Band("Subtitle", header, 151, 38), subtitle, 25, UiFactory.Muted);
        }

        private RectTransform Bottom(float height)
        {
            RectTransform bottom = UiFactory.Rect("Bottom", page, Vector2.zero, Vector2.right, Vector2.zero, new Vector2(0, height));
            UiFactory.Fill(bottom, UiFactory.Ink);
            return bottom;
        }

        private void FooterNav(RectTransform bottom, float top)
        {
            UiFactory.Button(UiFactory.Band("Back", bottom, top, 76), "Back", ShowMain);
        }

        private CharacterEntry Entry(string id)
        {
            foreach (CharacterEntry entry in Session.Catalog) if (entry.Definition.Id == id) return entry;
            foreach (CharacterEntry entry in Session.Archive) if (entry.Definition.Id == id) return entry;
            throw new ArgumentException("Unknown character: " + id);
        }

        private ProceduralActor Preview(string id, Vector3 at)
        {
            ProceduralActor actor = ProceduralActor.Create(Entry(id).Definition, id, at, false);
            actor.transform.rotation = Quaternion.Euler(0, previewYaw, 0);
            actors.Add(id, actor);
            return actor;
        }

        public void ShowMain()
        {
            if (BattlePlaying) return;
            ResultVisible = false;
            ClearPage("Main");
            Header("The Skyward Arena", "Chapter 01  /  The broken gate");
            Preview(selectedId, Vector3.zero);
            RectTransform bottom = Bottom(590);
            UiFactory.Label(UiFactory.Band("Resources", bottom, 24, 46), Session.Coins + " GOLD     /     " + Session.CompletedBattles + " BATTLES", 28, UiFactory.Mint);
            UiFactory.Label(UiFactory.Band("Team", bottom, 87, 60), SquadNames(), 29, UiFactory.Paper);
            UiFactory.Button(UiFactory.Band("Challenge", bottom, 168, 91), Session.HasPendingBattle ? "Resume battle" : "Enter arena", ShowStage, true);
            UiFactory.Button(UiFactory.Band("Squad", bottom, 279, 80), "Squad", ShowSquad);
            UiFactory.Button(UiFactory.Band("Archive", bottom, 379, 80), "Character archive", ShowCatalog);
            UiFactory.Button(UiFactory.Band("Audio", bottom, 479, 68), muted ? "Audio: Off" : "Audio: On", ToggleAudio);
            if (!string.IsNullOrEmpty(Session.RecoveryNotice))
                UiFactory.Label(UiFactory.Band("Recovery", page, 232, 80), Session.RecoveryNotice, 23, UiFactory.Paper);
        }

        private string SquadNames()
        {
            List<string> names = new List<string>();
            foreach (string id in Session.Squad) names.Add(Entry(id).Definition.DisplayName);
            return string.Join("  /  ", names.ToArray());
        }

        private void ToggleAudio() { muted = !muted; AudioListener.volume = muted ? 0 : 1; ShowMain(); }

        public void ShowCatalog()
        {
            ClearPage("Catalog");
            List<CharacterEntry> allEntries = new List<CharacterEntry>(Session.Archive);
            allEntries.Sort((a, b) => string.Compare(a.Definition.DisplayName, b.Definition.DisplayName, StringComparison.Ordinal));
            CharacterEntry current = Find(allEntries, selectedId);
            if (current == null && allEntries.Count > 0)
            {
                selectedId = allEntries[0].Definition.Id;
                current = allEntries[0];
                catalogCharacterPage = 0;
                catalogSkillPage = 0;
            }

            RectTransform bottom = Bottom(810);
            RectTransform filters = UiFactory.Band("Filters", bottom, 16, 62);
            UiFactory.Button(UiFactory.Rect("All", filters, Vector2.zero, new Vector2(0.22f, 1), Vector2.zero, Vector2.zero),
                "All", () => { catalogOwnedOnly = false; catalogCharacterPage = 0; ShowCatalog(); }, !catalogOwnedOnly);
            UiFactory.Button(UiFactory.Rect("Owned", filters, new Vector2(0.24f, 0), new Vector2(0.46f, 1), Vector2.zero, Vector2.zero),
                "Owned", () => { catalogOwnedOnly = true; catalogCharacterPage = 0; ShowCatalog(); }, catalogOwnedOnly);

            List<CharacterEntry> visibleEntries = new List<CharacterEntry>();
            for (int index = 0; index < allEntries.Count; index++)
                if (!catalogOwnedOnly || allEntries[index].Owned) visibleEntries.Add(allEntries[index]);
            int characterPageCount = Math.Max(1, (visibleEntries.Count + 5) / 6);
            catalogCharacterPage = Math.Max(0, Math.Min(catalogCharacterPage, characterPageCount - 1));
            if (visibleEntries.Count > 0 && Find(visibleEntries, selectedId) == null)
            {
                selectedId = visibleEntries[0].Definition.Id;
                catalogSkillPage = 0;
                if (current == null || !current.Owned || !catalogOwnedOnly) current = visibleEntries[0];
            }
            if (catalogOwnedOnly) current = Find(visibleEntries, selectedId);

            Header(current == null ? "Character archive" : current.Definition.DisplayName,
                current == null ? "No matching catalog entries" : current.Definition.Role + "  /  " + (current.Owned ? "Owned" : "Unowned"));
            if (current != null) Preview(selectedId, Vector3.zero);

            Button previousPage = UiFactory.Button(
                UiFactory.Rect("Previous page", filters, new Vector2(0.48f, 0), new Vector2(0.61f, 1), Vector2.zero, Vector2.zero),
                "Prev", () => { catalogCharacterPage--; catalogSkillPage = 0; ShowCatalog(); });
            previousPage.interactable = catalogCharacterPage > 0;
            UiFactory.Label(UiFactory.Rect("Page", filters, new Vector2(0.62f, 0), new Vector2(0.80f, 1), Vector2.zero, Vector2.zero),
                (catalogCharacterPage + 1) + " / " + characterPageCount, 25, UiFactory.Paper, TextAnchor.MiddleCenter);
            Button nextPage = UiFactory.Button(
                UiFactory.Rect("Next page", filters, new Vector2(0.81f, 0), Vector2.one, Vector2.zero, Vector2.zero),
                "Next", () => { catalogCharacterPage++; catalogSkillPage = 0; ShowCatalog(); });
            nextPage.interactable = catalogCharacterPage + 1 < characterPageCount;

            int firstCharacter = catalogCharacterPage * 6;
            for (int index = firstCharacter; index < Math.Min(firstCharacter + 6, visibleEntries.Count); index++)
            {
                CharacterEntry item = visibleEntries[index];
                int position = index - firstCharacter;
                int column = position % 3, row = position / 3;
                RectTransform tab = UiFactory.Rect(item.Definition.Id, bottom, new Vector2(column / 3f, 1), new Vector2((column + 1) / 3f, 1),
                    new Vector2(32, -94 - row * 75 - 65), new Vector2(-12, -94 - row * 75));
                string id = item.Definition.Id;
                UiFactory.Button(tab, item.Definition.DisplayName, () =>
                {
                    selectedId = id;
                    catalogSkillPage = 0;
                    ShowCatalog();
                }, selectedId == id);
            }

            if (current == null)
            {
                UiFactory.Label(UiFactory.Band("Empty", bottom, 277, 80), "No catalog heroes match this filter.", 27, UiFactory.Muted, TextAnchor.MiddleCenter);
                FooterNav(bottom, 706);
                return;
            }

            CharacterDefinition definition = current.Definition;
            UiFactory.Label(UiFactory.Band("Stats", bottom, 261, 44), "HP " + definition.MaxHp + "   ATK " + definition.Attack
                + "   DEF " + definition.Defense + "   SPD " + definition.Speed, 27, UiFactory.Mint);
            int skillPageCount = Math.Max(1, (definition.Skills.Count + 2) / 3);
            catalogSkillPage = Math.Max(0, Math.Min(catalogSkillPage, skillPageCount - 1));
            Button previousSkill = UiFactory.Button(
                UiFactory.Band("Previous skills", bottom, 318, 48, 32, 760),
                "Prev", () => { catalogSkillPage--; ShowCatalog(); });
            previousSkill.interactable = catalogSkillPage > 0;
            UiFactory.Label(UiFactory.Band("Skill page", bottom, 318, 48, 276, 554),
                "Skills " + (catalogSkillPage + 1) + " / " + skillPageCount, 24, UiFactory.Paper, TextAnchor.MiddleCenter);
            Button nextSkill = UiFactory.Button(
                UiFactory.Band("Next skills", bottom, 318, 48, 760, 32),
                "Next", () => { catalogSkillPage++; ShowCatalog(); });
            nextSkill.interactable = catalogSkillPage + 1 < skillPageCount;

            int firstSkill = catalogSkillPage * 3;
            for (int slot = 0; slot < 3 && firstSkill + slot < definition.Skills.Count; slot++)
            {
                SkillDefinition skill = definition.Skills[firstSkill + slot];
                float top = 378 + slot * 92;
                UiFactory.Label(UiFactory.Band("Skill title " + slot, bottom, top, 30), skill.DisplayName, 24, UiFactory.Paper);
                UiFactory.Label(UiFactory.Band("Skill description " + slot, bottom, top + 30, 52),
                    GameCatalog.DescribeSkill(skill), 20, UiFactory.Muted);
            }
            UiFactory.Label(UiFactory.Band("Source", bottom, 654, 42), current.SkillStatus + "  /  " + current.Source, 21, UiFactory.Muted);
            FooterNav(bottom, 706);
        }

        private static CharacterEntry Find(IList<CharacterEntry> entries, string id)
        {
            for (int index = 0; index < entries.Count; index++)
                if (entries[index].Definition.Id == id) return entries[index];
            return null;
        }

        public void ShowSquad()
        {
            ClearPage("Squad");
            arena.Camera.orthographicSize = 4.4f;
            Header("Your squad", "Skyward Arena  /  3 of 3");
            for (int i = 0; i < Session.Squad.Count; i++) Preview(Session.Squad[i], new Vector3((i - 1) * 2.4f, 0, 0));
            RectTransform bottom = Bottom(650);
            for (int i = 0; i < 3; i++)
            {
                int slot = i;
                UiFactory.Button(UiFactory.Band("Slot " + i, bottom, 28 + i * 102, 82), (i + 1) + "   " + Entry(Session.Squad[i]).Definition.DisplayName,
                    () => { selectedSlot = slot; ShowSquad(); }, selectedSlot == i);
            }
            UiFactory.Button(UiFactory.Band("Swap", bottom, 352, 78), "Swap with next slot", () => Guard(() =>
            {
                List<string> squad = new List<string>(Session.Squad);
                int next = (selectedSlot + 1) % squad.Count;
                string previous = squad[selectedSlot]; squad[selectedSlot] = squad[next]; squad[next] = previous;
                Session.SetSquad(squad); selectedSlot = next; ShowSquad();
            }));
            UiFactory.Button(UiFactory.Band("Challenge", bottom, 452, 78), Session.HasPendingBattle ? "Resume battle" : "Enter arena", ShowStage, true);
            FooterNav(bottom, 551);
        }

        public void ShowStage()
        {
            ClearPage("Stage");
            arena.Camera.orthographicSize = 4.4f;
            Header("The broken gate", "Chapter 01  /  Skyward Arena");
            IList<CharacterDefinition> enemies = BattleCatalog.CreateEnemies();
            for (int i = 0; i < enemies.Count; i++) Preview(enemies[i].Id, new Vector3((i - 1) * 2.4f, 0, 0));
            RectTransform bottom = Bottom(590);
            UiFactory.Label(UiFactory.Band("Enemy squad", bottom, 25, 50), "Raider  /  Archer  /  Chief", 31, UiFactory.Paper);
            UiFactory.Label(UiFactory.Band("Reward", bottom, 100, 48), "VICTORY REWARD   /   " + GameCatalog.VictoryCoins + " GOLD", 28, UiFactory.Mint);
            UiFactory.Label(UiFactory.Band("Your squad", bottom, 178, 70), SquadNames(), 27, UiFactory.Muted);
            UiFactory.Button(UiFactory.Band("Challenge", bottom, 280, 90), Session.HasPendingBattle ? "Resume battle" : "Challenge", StartBattle, true);
            UiFactory.Button(UiFactory.Band("Squad", bottom, 390, 76), "Squad", ShowSquad);
            FooterNav(bottom, 488);
        }

        public void StartBattle()
        {
            if (BattlePlaying) return;
            Guard(() => { CurrentBattle = Session.BeginBattle(); SceneManager.LoadScene("Battle"); });
        }

        private void BuildBattle()
        {
            if (CurrentBattle == null) CurrentBattle = Session.GetPendingBattle();
            if (CurrentBattle == null) { SceneManager.LoadScene("Main"); return; }
            ClearPage("Battle", true);
            ResultVisible = false; PresentedEvents = 0; SkillCues = 0; allyDamage.Clear(); speed = 1;
            RectTransform header = UiFactory.Band("Battle header", page, 0, 170, 0, 0);
            UiFactory.Fill(header, UiFactory.Ink);
            roundLabel = UiFactory.Label(UiFactory.Band("Round", header, 25, 60), "ROUND 01", 37, UiFactory.Paper);
            actionLabel = UiFactory.Label(UiFactory.Band("Action", header, 94, 43), "The broken gate", 25, UiFactory.Muted);
            RectTransform bottom = Bottom(170);
            RectTransform speedRect = UiFactory.Rect("Speed", bottom, new Vector2(0, 0), new Vector2(0.48f, 1), new Vector2(32, 42), new Vector2(-12, -42));
            Button speedButton = UiFactory.Button(speedRect, "1x", ToggleSpeed);
            speedLabel = speedButton.GetComponentInChildren<Text>();
            UiFactory.Button(UiFactory.Rect("Skip", bottom, new Vector2(0.5f, 0), Vector2.one, new Vector2(12, 42), new Vector2(-32, -42)), "Skip", SkipBattle);
            healthLayer = UiFactory.Rect("Health", page, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            AddTeam(CurrentBattle.Allies, TeamSide.Ally); AddTeam(CurrentBattle.Enemies, TeamSide.Enemy);
            BattlePlaying = true;
            playback = StartCoroutine(PlayBattle());
        }

        private void AddTeam(IList<CharacterDefinition> team, TeamSide side)
        {
            for (int i = 0; i < team.Count; i++)
            {
                string id = new Combatant(team[i], side, i).InstanceId;
                ProceduralActor actor = ProceduralActor.Create(team[i], id, ArenaView.Slot(i, side == TeamSide.Enemy), side == TeamSide.Enemy);
                actors.Add(id, actor);
                RectTransform bar = UiFactory.Rect(id, healthLayer, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-102, -30), new Vector2(102, 30));
                bars.Add(id, bar);
                UiFactory.Fill(bar, UiFactory.Ink);
                RectTransform track = UiFactory.Rect("HP track", bar, Vector2.zero, Vector2.one, new Vector2(4, 3), new Vector2(-4, -39));
                UiFactory.Fill(track, new Color(0.25f, 0.28f, 0.29f));
                RectTransform fillRect = UiFactory.Rect("HP", track, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
                fills[id] = UiFactory.Fill(fillRect, side == TeamSide.Ally ? UiFactory.Mint : new Color(0.98f, 0.4f, 0.42f));
                hpLabels[id] = UiFactory.Label(UiFactory.Rect("Name", bar, new Vector2(0, 0.35f), Vector2.one, Vector2.zero, Vector2.zero), team[i].DisplayName + " " + team[i].MaxHp, 22, UiFactory.Paper, TextAnchor.MiddleCenter);
            }
        }

        private IEnumerator PlayBattle()
        {
            yield return new WaitForSeconds(0.65f);
            IList<BattleEvent> events = CurrentBattle.Result.Events;
            for (int index = 0; index < events.Count; index++)
            {
                BattleEvent item = events[index];
                if (item.Type == BattleEventType.RoundStarted)
                {
                    roundLabel.text = "ROUND " + item.Round.ToString("00");
                    yield return new WaitForSeconds(0.18f / speed);
                }
                if (item.Type == BattleEventType.ActionStarted)
                {
                    ProceduralActor actor = actors[item.ActorInstanceId];
                    actingActor = actor;
                    SkillDefinition skill = item.Skill ? actor.Definition.UltimateSkill : actor.Definition.BasicSkill;
                    actionLabel.text = actor.Definition.DisplayName + " / " + skill.DisplayName;
                    Vector3 target = actor.Home;
                    for (int next = index + 1; next < events.Count && events[next].Type != BattleEventType.ActionStarted; next++)
                    {
                        ProceduralActor found;
                        if ((events[next].Type == BattleEventType.Damage || events[next].Type == BattleEventType.Heal || events[next].Type == BattleEventType.Shield)
                            && actors.TryGetValue(events[next].TargetInstanceId, out found)) { target = found.Home; break; }
                    }
                    SetTarget(target);
                    if (item.Skill)
                    {
                        SkillCues++;
                        ShowCutIn(actor, skill);
                        yield return arena.Focus(actor, speed);
                        yield return new WaitForSeconds(0.52f / speed);
                        CloseCutIn(); arena.ResetCamera();
                        arena.Pulse(actor.Home + Vector3.up * 0.1f, actor.Accent, 2.6f);
                    }
                    yield return actor.Windup(target, item.Skill, speed);
                    if (actor.Definition.Role == "Support") yield return arena.Bolt(actor.HitPoint, target + Vector3.up, actor.Accent, speed);
                }
                ApplyEvent(item, true);
                PresentedEvents = index + 1;
                bool actionEnds = index + 1 >= events.Count || events[index + 1].Type == BattleEventType.ActionStarted
                    || events[index + 1].Type == BattleEventType.RoundStarted || events[index + 1].Type == BattleEventType.BattleEnded;
                if (actionEnds && item.Type != BattleEventType.RoundStarted && item.Type != BattleEventType.BattleStarted)
                {
                    if (actingActor && !actingActor.IsDead) yield return actingActor.Recover(speed);
                    actingActor = null;
                    yield return new WaitForSeconds(0.28f / speed);
                }
            }
            BattlePlaying = false; playback = null; ShowResult();
        }

        private void SetTarget(Vector3 target) { arena.Pulse(target + Vector3.up * 0.08f, new Color(1, 0.86f, 0.3f), 0.65f); }

        private void ApplyEvent(BattleEvent item, bool animated)
        {
            ProceduralActor target, actor;
            actors.TryGetValue(item.ActorInstanceId, out actor);
            actors.TryGetValue(item.TargetInstanceId, out target);
            if (actor) actor.SetActionState(item.Rage, item.WarStacks);
            if (item.Type == BattleEventType.Damage || item.Type == BattleEventType.Heal || item.Type == BattleEventType.Shield)
            {
                if (!target) throw new InvalidOperationException("Event target is missing: " + item.TargetInstanceId);
                int before = target.Hp;
                target.SetHealth(item.RemainingHp); target.SetShield(item.RemainingShield);
                fills[target.InstanceId].rectTransform.anchorMax = new Vector2((float)target.Hp / target.Definition.MaxHp, 1);
                hpLabels[target.InstanceId].text = target.Definition.DisplayName + " " + target.Hp + (target.Shield > 0 ? " +" + target.Shield : "");
                if (item.Type == BattleEventType.Damage && item.ActorInstanceId.StartsWith("ally:", StringComparison.Ordinal))
                {
                    if (!allyDamage.ContainsKey(item.ActorInstanceId)) allyDamage[item.ActorInstanceId] = 0;
                    allyDamage[item.ActorInstanceId] += before - target.Hp;
                }
                if (animated)
                {
                    Color color = item.Type == BattleEventType.Heal ? UiFactory.Mint : item.Type == BattleEventType.Shield ? new Color(0.4f, 0.8f, 1) : item.Critical ? new Color(1, 0.83f, 0.26f) : Color.white;
                    string number = item.Type == BattleEventType.Damage ? "-" + (before - target.Hp) : "+" + item.Amount;
                    if (item.Absorbed > 0) number += " (" + item.Absorbed + " blocked)";
                    FloatNumber(target.HitPoint, number + (item.Critical ? "!" : ""), color, item.Critical);
                    arena.Hit(target.HitPoint, color, item.Critical);
                    if (item.Type == BattleEventType.Damage) target.React();
                    if (item.Skill) arena.Pulse(target.Home + Vector3.up * 0.14f, color, 1.5f);
                }
            }
            else if (item.Type == BattleEventType.UnitDied && target) target.Die();
        }

        private void FloatNumber(Vector3 point, string value, Color color, bool critical)
        {
            Vector2 local;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(safe, arena.Camera.WorldToScreenPoint(point), null, out local);
            RectTransform rect = UiFactory.Rect("Damage", page, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-210, -36), new Vector2(210, 36));
            rect.anchoredPosition = local;
            Text label = UiFactory.Label(rect, value, critical ? 40 : 32, color, TextAnchor.MiddleCenter);
            StartCoroutine(Drift(rect, label));
        }

        private IEnumerator Drift(RectTransform rect, Text label)
        {
            Vector2 start = rect.anchoredPosition; Color color = label.color;
            for (float t = 0; t < 0.8f && rect; t += Time.deltaTime)
            {
                rect.anchoredPosition = start + Vector2.up * t * 145;
                label.color = new Color(color.r, color.g, color.b, 1 - t / 0.8f);
                yield return null;
            }
            if (rect) Destroy(rect.gameObject);
        }

        private void ShowCutIn(ProceduralActor actor, SkillDefinition skill)
        {
            cutIn = UiFactory.Band("Skill cue", page, 270, 230, 0, 0);
            UiFactory.Fill(cutIn, new Color(0.05f, 0.09f, 0.1f, 0.96f));
            UiFactory.Label(UiFactory.Band("Name", cutIn, 24, 44), actor.Definition.DisplayName.ToUpperInvariant(), 31, actor.Accent);
            UiFactory.Label(UiFactory.Band("Skill", cutIn, 77, 68), skill.DisplayName, 44, UiFactory.Paper);
            string line = actor.Definition.Role == "Tank" ? "Stand behind me." : actor.Definition.Role == "Support" ? "Let hope bloom." : "The sky is ours!";
            UiFactory.Label(UiFactory.Band("Line", cutIn, 160, 40), line, 27, UiFactory.Muted);
        }

        private void CloseCutIn() { if (cutIn) { cutIn.gameObject.SetActive(false); Destroy(cutIn.gameObject); cutIn = null; } }
        public void ToggleSpeed() { speed = speed == 1 ? 2 : 1; if (speedLabel) speedLabel.text = speed + "x"; }

        public void SkipBattle()
        {
            if (!BattlePlaying || CurrentBattle == null) return;
            if (playback != null) StopCoroutine(playback);
            CloseCutIn();
            for (int i = PresentedEvents; i < CurrentBattle.Result.Events.Count; i++) ApplyEvent(CurrentBattle.Result.Events[i], false);
            PresentedEvents = CurrentBattle.Result.Events.Count;
            foreach (ProceduralActor actor in actors.Values) actor.SnapToRest();
            BattlePlaying = false; playback = null; actingActor = null; arena.StopEffects(); ShowResult();
        }

        private void ShowResult()
        {
            ResultVisible = true;
            RectTransform result = UiFactory.Rect("Result", page, new Vector2(0, 0.18f), new Vector2(1, 0.75f), Vector2.zero, Vector2.zero);
            UiFactory.Fill(result, UiFactory.Ink);
            BattleResult outcome = CurrentBattle.Result;
            UiFactory.Label(UiFactory.Band("Outcome", result, 40, 90), outcome.Victory ? "VICTORY" : "DEFEAT", 60, outcome.Victory ? UiFactory.Mint : new Color(1, 0.4f, 0.42f), TextAnchor.MiddleCenter);
            string mvp = "-"; int maximum = -1;
            foreach (KeyValuePair<string, int> pair in allyDamage) if (pair.Value > maximum) { maximum = pair.Value; mvp = actors[pair.Key].Definition.DisplayName; }
            UiFactory.Label(UiFactory.Band("MVP", result, 155, 65), "MVP  /  " + mvp, 35, UiFactory.Paper, TextAnchor.MiddleCenter);
            UiFactory.Label(UiFactory.Band("Stats", result, 240, 60), outcome.Rounds + " ROUNDS    /    " + outcome.SurvivingAllies + " SURVIVORS", 28, UiFactory.Muted, TextAnchor.MiddleCenter);
            UiFactory.Label(UiFactory.Band("Reward", result, 328, 72), "GOLD  +" + (outcome.Victory ? GameCatalog.VictoryCoins : 0), 38, UiFactory.Mint, TextAnchor.MiddleCenter);
            UiFactory.Button(UiFactory.Band("Confirm", result, 435, 88), "Confirm", ConfirmResult, true);
        }

        public void ConfirmResult()
        {
            if (!ResultVisible || CurrentBattle == null) return;
            Guard(() =>
            {
                Session.ClaimReward(CurrentBattle.TicketId); CurrentBattle = null; ResultVisible = false;
                SceneManager.LoadScene("Main");
            });
        }

        private void Guard(Action action)
        {
            try { action(); }
            catch (Exception exception) { LastError = exception.Message; Debug.LogException(exception); ShowError(exception.Message); }
        }

        private void ShowError(string message)
        {
            RectTransform error = UiFactory.Band("Error", page, 225, 140);
            UiFactory.Fill(error, new Color(0.35f, 0.08f, 0.12f));
            UiFactory.Label(error, message, 25, UiFactory.Paper);
        }

        private void ShowFatal()
        {
            page = UiFactory.Rect("Save unavailable", safe, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            UiFactory.Fill(page, UiFactory.Ink); Header("Save unavailable", "Profile could not be opened");
            UiFactory.Label(UiFactory.Band("Error", page, 280, 420), LastError, 28, UiFactory.Paper);
        }

        private void OnApplicationPause(bool paused) { if (paused && Session != null) Guard(Session.Save); }
        private void OnApplicationQuit() { if (Session != null) { try { Session.Save(); } catch (Exception e) { Debug.LogError(e.Message); } } }
        private void OnDestroy() { if (Instance == this) { SceneManager.sceneLoaded -= SceneLoaded; Instance = null; } }
    }
}
