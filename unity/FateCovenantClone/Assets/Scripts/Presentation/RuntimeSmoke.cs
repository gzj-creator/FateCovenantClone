using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using FateCovenant.Battle;
using FateCovenant.Game;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace FateCovenant.Presentation
{
    public sealed class RuntimeSmoke : MonoBehaviour
    {
        [Serializable]
        private sealed class Report
        {
            public bool passed;
            public string unityVersion;
            public string error;
            public int completedBattles;
            public int coins;
            public int skillCues;
            public string[] checks;
        }

        private readonly List<string> checks = new List<string>();
        private string runtimeError;
        private string captures;
        private int skillCues;

        public static void Begin()
        {
            if (FindFirstObjectByType<RuntimeSmoke>()) return;
            GameObject root = new GameObject("Runtime acceptance");
            DontDestroyOnLoad(root);
            root.AddComponent<RuntimeSmoke>().StartCoroutine(root.GetComponent<RuntimeSmoke>().RunGuarded());
        }

        private void OnEnable() { Application.logMessageReceived += Log; }
        private void OnDisable() { Application.logMessageReceived -= Log; }
        private void Log(string condition, string trace, LogType type)
        {
            if (type == LogType.Exception || type == LogType.Error || type == LogType.Assert) runtimeError = condition + "\n" + trace;
        }

        private IEnumerator RunGuarded()
        {
            Stack<IEnumerator> routines = new Stack<IEnumerator>();
            routines.Push(Run());
            while (routines.Count > 0)
            {
                bool next;
                object current = null;
                try
                {
                    IEnumerator active = routines.Peek();
                    next = active.MoveNext();
                    if (next) current = active.Current;
                }
                catch (Exception exception) { WriteReport(false, exception.ToString()); yield break; }
                if (!next) { routines.Pop(); continue; }
                IEnumerator nested = current as IEnumerator;
                if (nested != null) { routines.Push(nested); continue; }
                yield return current;
            }
            WriteReport(string.IsNullOrEmpty(runtimeError), runtimeError);
        }

        private IEnumerator Run()
        {
            captures = Environment.GetEnvironmentVariable("FATE_SMOKE_CAPTURE");
            if (string.IsNullOrEmpty(captures)) throw new InvalidOperationException("Smoke requires an isolated capture directory.");
            Directory.CreateDirectory(captures);
            float deadline = Time.realtimeSinceStartup + 15;
            while ((!GameBootstrap.Instance || GameBootstrap.Instance.Session == null || SceneManager.GetActiveScene().name != "Main"
                || !FindFirstObjectByType<Canvas>()) && Time.realtimeSinceStartup < deadline) yield return null;
            GameBootstrap game = GameBootstrap.Instance;
            Require(game && game.Session != null && SceneManager.GetActiveScene().name == "Main" && FindFirstObjectByType<Canvas>(), "boot opens a profile and Main UI");
            yield return null; yield return null;
            Require(string.IsNullOrEmpty(game.LastError), "boot has no application error");
            foreach (int height in new[] { 960, 1200 })
            {
                Screen.SetResolution(540, height, false);
                yield return new WaitForSeconds(0.3f);
                CheckText(); yield return Capture("01-main-" + height);
                game.ShowCatalog(); yield return null; yield return null;
                Require(game.Session.Archive.Count == 76, "catalog UI loads all 76 visible heroes");
                CheckText(); yield return Capture("02-catalog-" + height);
                game.ShowSquad(); yield return null; yield return null;
                CheckText(); yield return Capture("03-squad-" + height);
                game.ShowStage(); yield return null; yield return null;
                CheckText(); yield return Capture("04-stage-" + height);
                game.ShowMain(); yield return null; yield return null;
            }
            List<string> squad = new List<string>(game.Session.Squad);
            string first = squad[0]; squad[0] = squad[2]; squad[2] = first;
            game.Session.SetSquad(squad);
            Require(game.Session.Squad[0] == squad[0], "squad changes persist");
            int initialBattles = game.Session.CompletedBattles;
            int initialCoins = game.Session.Coins;
            int expectedCoins = initialCoins;
            for (int battle = 0; battle < 3; battle++)
            {
                game.StartBattle();
                deadline = Time.realtimeSinceStartup + 10;
                while (!game.BattlePlaying && Time.realtimeSinceStartup < deadline) yield return null;
                Require(game.BattlePlaying, "battle " + battle + " begins");
                if (battle == 1) game.ToggleSpeed();
                yield return new WaitForSeconds(0.4f);
                yield return Capture("04-battle-" + battle);
                CheckArenaPixels(540, 960, "portrait-16-9-" + battle);
                CheckArenaPixels(540, 1200, "portrait-20-9-" + battle);
                if (battle == 2) game.SkipBattle();
                deadline = Time.realtimeSinceStartup + 90;
                while (game.BattlePlaying && Time.realtimeSinceStartup < deadline) yield return null;
                Require(game.ResultVisible && !game.BattlePlaying, "battle " + battle + " reaches result");
                Require(game.PresentedEvents == game.CurrentBattle.Result.Events.Count, "all events are consumed");
                CheckText(); yield return Capture("05-result-" + battle);
                CheckState(game);
                if (battle != 2) Require(game.SkillCues > 0, "skill presentation executes");
                skillCues += game.SkillCues;
                if (game.CurrentBattle.Result.Victory) expectedCoins += GameCatalog.VictoryCoins;
                string ticket = game.CurrentBattle.TicketId;
                game.ConfirmResult();
                yield return null; yield return null;
                Require(!game.Session.ClaimReward(ticket).Granted, "repeat claim grants no reward");
            }
            Require(game.Session.CompletedBattles == initialBattles + 3, "three consecutive battles complete");
            Require(game.Session.Coins == expectedCoins, "only earned rewards are credited");
            GameSession reopened = GameSession.Open(Path.GetDirectoryName(game.Session.SavePath));
            Require(reopened.Coins == expectedCoins && reopened.Squad[0] == squad[0], "reopen retains resources and squad");
            Require(string.IsNullOrEmpty(game.LastError) && string.IsNullOrEmpty(runtimeError), "no runtime errors during flow");
            yield return Capture("06-final-main");
        }

        private void CheckState(GameBootstrap game)
        {
            Dictionary<string, int> hp = new Dictionary<string, int>();
            Dictionary<string, int> shield = new Dictionary<string, int>();
            Dictionary<string, int> rage = new Dictionary<string, int>();
            Dictionary<string, int> war = new Dictionary<string, int>();
            foreach (ProceduralActor actor in game.Actors)
            {
                hp[actor.InstanceId] = actor.Definition.MaxHp; shield[actor.InstanceId] = 0;
                rage[actor.InstanceId] = 50; war[actor.InstanceId] = 0;
            }
            foreach (BattleEvent item in game.CurrentBattle.Result.Events)
            {
                if (rage.ContainsKey(item.ActorInstanceId)) { rage[item.ActorInstanceId] = item.Rage; war[item.ActorInstanceId] = item.WarStacks; }
                if (item.Type == BattleEventType.Damage || item.Type == BattleEventType.Heal || item.Type == BattleEventType.Shield)
                { hp[item.TargetInstanceId] = item.RemainingHp; shield[item.TargetInstanceId] = item.RemainingShield; }
            }
            foreach (ProceduralActor actor in game.Actors)
                Require(actor.Hp == hp[actor.InstanceId] && actor.Shield == shield[actor.InstanceId]
                    && actor.Rage == rage[actor.InstanceId] && actor.WarStacks == war[actor.InstanceId]
                    && actor.IsDead == (actor.Hp == 0), "presentation matches event state for " + actor.InstanceId);
        }

        private void CheckText()
        {
            Canvas.ForceUpdateCanvases();
            foreach (Text label in FindObjectsByType<Text>(FindObjectsSortMode.None))
            {
                if (!label.isActiveAndEnabled || string.IsNullOrEmpty(label.text)) continue;
                Require(label.preferredHeight <= label.rectTransform.rect.height + 2, "text fits: " + label.gameObject.name);
            }
        }

        private void CheckArenaPixels(int width, int height, string name)
        {
            ArenaView arena = FindFirstObjectByType<ArenaView>();
            Require(arena && arena.Camera, "arena has a camera");
            Camera camera = arena.Camera;
            RenderTexture previous = RenderTexture.active;
            RenderTexture target = RenderTexture.GetTemporary(width, height, 24);
            RenderTexture oldTarget = camera.targetTexture;
            Rect oldRect = camera.rect;
            Texture2D texture = new Texture2D(width, height, TextureFormat.RGB24, false);
            try
            {
                camera.targetTexture = target; camera.rect = new Rect(0, 0, 1, 1); camera.Render();
                RenderTexture.active = target;
                texture.ReadPixels(new Rect(0, 0, width, height), 0, 0); texture.Apply();
                Color[] pixels = texture.GetPixels();
                Color min = Color.white, max = Color.black;
                for (int i = 0; i < pixels.Length; i += 43)
                {
                    min.r = Mathf.Min(min.r, pixels[i].r); max.r = Mathf.Max(max.r, pixels[i].r);
                    min.g = Mathf.Min(min.g, pixels[i].g); max.g = Mathf.Max(max.g, pixels[i].g);
                    min.b = Mathf.Min(min.b, pixels[i].b); max.b = Mathf.Max(max.b, pixels[i].b);
                }
                Require(max.r - min.r + max.g - min.g + max.b - min.b > 0.5f, "nonblank arena " + name);
                foreach (ProceduralActor actor in GameBootstrap.Instance.Actors)
                {
                    Vector3 foot = camera.WorldToViewportPoint(actor.Home);
                    Vector3 head = camera.WorldToViewportPoint(actor.Home + Vector3.up * 2.5f);
                    Require(foot.z > 0 && foot.x > 0.04f && foot.x < 0.96f && foot.y > 0.05f
                        && head.y < 0.9f, "actor is framed at " + width + "x" + height);
                }
                File.WriteAllBytes(Path.Combine(captures, name + ".png"), texture.EncodeToPNG());
            }
            finally
            {
                camera.targetTexture = oldTarget; camera.rect = oldRect; RenderTexture.active = previous;
                RenderTexture.ReleaseTemporary(target); Destroy(texture);
            }
        }

        private IEnumerator Capture(string name)
        {
            string path = Path.Combine(captures, name + ".png");
            ScreenCapture.CaptureScreenshot(path);
            // Batch-mode Editor does not resume WaitForEndOfFrame reliably. Keep the page
            // unchanged across a rendered frame and wait for the screenshot file instead.
            yield return null;
            float deadline = Time.realtimeSinceStartup + 5;
            while (!File.Exists(path) && Time.realtimeSinceStartup < deadline) yield return null;
            Require(File.Exists(path) && new FileInfo(path).Length > 0, "screenshot saved: " + name);
            yield return null;
        }

        private void Require(bool condition, string check)
        {
            if (!condition) throw new InvalidOperationException(check);
            checks.Add(check);
        }

        private void WriteReport(bool passed, string error)
        {
            string path = Environment.GetEnvironmentVariable("FATE_SMOKE_REPORT");
            if (string.IsNullOrEmpty(path)) { Debug.LogError("Smoke report path is not configured."); return; }
            GameBootstrap game = GameBootstrap.Instance;
            Report report = new Report { passed = passed, error = error, unityVersion = Application.unityVersion,
                completedBattles = game && game.Session != null ? game.Session.CompletedBattles : 0,
                coins = game && game.Session != null ? game.Session.Coins : 0, skillCues = skillCues, checks = checks.ToArray() };
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            File.WriteAllText(path + ".next", JsonUtility.ToJson(report, true));
            File.Move(path + ".next", path);
        }
    }
}
