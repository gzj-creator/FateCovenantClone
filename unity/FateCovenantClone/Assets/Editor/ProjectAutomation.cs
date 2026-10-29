using System;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace FateCovenant.Editor
{
    public static class ProjectAutomation
    {
        private const string Version = "6000.0.85f1";
        private const string BootstrapTypeName = "FateCovenant.Presentation.GameBootstrap";
        private static readonly string[] Scenes = { "Assets/Scenes/Boot.unity", "Assets/Scenes/Main.unity", "Assets/Scenes/Battle.unity" };
        private static double smokeStarted;
        private static bool smokeInvoked;

        [MenuItem("Fate Covenant/Configure Project")]
        public static void Setup()
        {
            RequireVersion();
            EditorSettings.serializationMode = SerializationMode.ForceText;
            PlayerSettings.companyName = "FateCovenant";
            PlayerSettings.productName = "Fate Covenant";
            PlayerSettings.bundleVersion = "0.2.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "com.fatecovenant.clone");
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.Android.targetSdkVersion = AndroidSdkVersions.AndroidApiLevelAuto;
            PlayerSettings.Android.bundleVersionCode = 2;
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.defaultScreenWidth = 540;
            PlayerSettings.defaultScreenHeight = 960;
            PlayerSettings.runInBackground = false;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            var playerSettings = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset")[0]);
            var inputHandler = playerSettings.FindProperty("activeInputHandler");
            if (inputHandler == null) throw new InvalidOperationException("PlayerSettings activeInputHandler is unavailable.");
            inputHandler.intValue = 0;
            playerSettings.ApplyModifiedPropertiesWithoutUndo();
            QualitySettings.vSyncCount = 0;
            QualitySettings.shadows = ShadowQuality.Disable;
            ConfigureRendering();
            EnsureScenes();
            EditorBuildSettings.scenes = Scenes.Select(path => new EditorBuildSettingsScene(path, true)).ToArray();
            AssetDatabase.SaveAssets();
            Debug.Log("PROJECT_SETUP_PASS: Unity " + Version + ", URP, Boot/Main/Battle, Android IL2CPP ARM64. Device validation remains separate.");
        }

        private static void ConfigureRendering()
        {
            Directory.CreateDirectory("Assets/Settings");
            const string pipelinePath = "Assets/Settings/MobilePipeline.asset";
            var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(pipelinePath);
            if (pipeline == null)
            {
                var renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
                AssetDatabase.CreateAsset(renderer, "Assets/Settings/MobileRenderer.asset");
                pipeline = ScriptableObject.CreateInstance<UniversalRenderPipelineAsset>();
                var serialized = new SerializedObject(pipeline);
                var renderers = serialized.FindProperty("m_RendererDataList");
                renderers.arraySize = 1;
                renderers.GetArrayElementAtIndex(0).objectReferenceValue = renderer;
                serialized.ApplyModifiedPropertiesWithoutUndo();
                AssetDatabase.CreateAsset(pipeline, pipelinePath);
            }
            pipeline.supportsHDR = false;
            pipeline.msaaSampleCount = 2;
            GraphicsSettings.defaultRenderPipeline = pipeline;
            QualitySettings.renderPipeline = pipeline;
            var graphics = new SerializedObject(AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset")[0]);
            var included = graphics.FindProperty("m_AlwaysIncludedShaders");
            foreach (var shaderName in new[] { "Universal Render Pipeline/Simple Lit", "Universal Render Pipeline/Unlit", "UI/Default", "UI/Default Font" })
            {
                var shader = Shader.Find(shaderName);
                if (shader == null) throw new InvalidOperationException("Required shader missing: " + shaderName);
                bool exists = false;
                for (int i = 0; i < included.arraySize; i++)
                    if (included.GetArrayElementAtIndex(i).objectReferenceValue == shader) exists = true;
                if (!exists)
                {
                    included.InsertArrayElementAtIndex(included.arraySize);
                    included.GetArrayElementAtIndex(included.arraySize - 1).objectReferenceValue = shader;
                }
            }
            graphics.ApplyModifiedPropertiesWithoutUndo();
            EditorUtility.SetDirty(pipeline);
        }

        private static void EnsureScenes()
        {
            Directory.CreateDirectory("Assets/Scenes");
            var bootstrapType = AppDomain.CurrentDomain.GetAssemblies().Select(assembly => assembly.GetType(BootstrapTypeName)).FirstOrDefault(type => type != null);
            if (bootstrapType == null || !typeof(MonoBehaviour).IsAssignableFrom(bootstrapType))
                throw new InvalidOperationException("Missing runtime entry point: " + BootstrapTypeName);
            foreach (var path in Scenes)
            {
                if (File.Exists(path)) continue;
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                if (path == Scenes[0]) new GameObject("GameBootstrap").AddComponent(bootstrapType);
                if (!EditorSceneManager.SaveScene(scene, path)) throw new IOException("Could not save scene " + path);
            }
            EditorSceneManager.OpenScene(Scenes[0]);
        }

        [MenuItem("Fate Covenant/Validate Project")]
        public static void Test()
        {
            Setup();
            if (GraphicsSettings.defaultRenderPipeline == null) throw new InvalidOperationException("URP pipeline is not assigned.");
            if (EditorBuildSettings.scenes.Length != 3 || EditorBuildSettings.scenes.Any(scene => !scene.enabled || !File.Exists(scene.path)))
                throw new InvalidOperationException("Build scenes are incomplete.");
            var scene = EditorSceneManager.OpenScene(Scenes[0]);
            if (!scene.GetRootGameObjects().SelectMany(root => root.GetComponents<MonoBehaviour>()).Any(component => component != null && component.GetType().FullName == BootstrapTypeName))
                throw new InvalidOperationException("Boot scene has no GameBootstrap.");
            if (PlayerSettings.GetScriptingBackend(NamedBuildTarget.Android) != ScriptingImplementation.IL2CPP || PlayerSettings.Android.targetArchitectures != AndroidArchitecture.ARM64)
                throw new InvalidOperationException("Android must use IL2CPP ARM64.");
            Debug.Log("PROJECT_VALIDATION_PASS: project and scene configuration. This is not runtime or device acceptance.");
        }

        public static void BuildAndroid()
        {
            Setup();
            EditorUserBuildSettings.buildAppBundle = false;
            Build(BuildTarget.Android, "builds/android/FateCovenantClone.apk");
        }

        public static void BuildWindows()
        {
            Setup();
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Standalone, ScriptingImplementation.Mono2x);
            Build(BuildTarget.StandaloneWindows64, "builds/windows/FateCovenantClone.exe");
        }

        public static void Smoke()
        {
            Setup();
            string evidenceRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../analysis/test-runs/unity/smoke"));
            Directory.CreateDirectory(evidenceRoot);
            string runId = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss-fff");
            string runRoot = Path.Combine(evidenceRoot, runId);
            Directory.CreateDirectory(runRoot);
            Environment.SetEnvironmentVariable("FATE_SMOKE_REPORT", Path.Combine(runRoot, "runtime-report.json"));
            Environment.SetEnvironmentVariable("FATE_SMOKE_SAVE", Path.Combine(runRoot, "save"));
            Environment.SetEnvironmentVariable("FATE_SMOKE_CAPTURE", Path.Combine(runRoot, "captures"));
            File.WriteAllText(Path.Combine(evidenceRoot, "latest-run.txt"), runRoot);
            SessionState.SetString("FateSmokeReport", Environment.GetEnvironmentVariable("FATE_SMOKE_REPORT"));
            SessionState.SetBool("FateSmokeActive", true);
            EditorSettings.enterPlayModeOptionsEnabled = true;
            EditorSettings.enterPlayModeOptions = EnterPlayModeOptions.DisableDomainReload;
            smokeStarted = EditorApplication.timeSinceStartup;
            smokeInvoked = false;
            EditorApplication.update += PollSmoke;
            EditorApplication.isPlaying = true;
        }

        private static void PollSmoke()
        {
            try
            {
                if (EditorApplication.timeSinceStartup - smokeStarted > 240)
                    throw new TimeoutException("Runtime smoke did not complete in 240 seconds.");
                if (!EditorApplication.isPlaying) return;
                if (!smokeInvoked)
                {
                    var smokeType = AppDomain.CurrentDomain.GetAssemblies().Select(assembly => assembly.GetType("FateCovenant.Presentation.RuntimeSmoke")).FirstOrDefault(type => type != null);
                    var begin = smokeType == null ? null : smokeType.GetMethod("Begin", BindingFlags.Public | BindingFlags.Static);
                    if (begin == null) throw new InvalidOperationException("RuntimeSmoke.Begin is missing.");
                    begin.Invoke(null, null);
                    smokeInvoked = true;
                }
                string path = SessionState.GetString("FateSmokeReport", string.Empty);
                if (!File.Exists(path)) return;
                var report = JsonUtility.FromJson<SmokeRecord>(File.ReadAllText(path));
                if (report == null) throw new InvalidOperationException("Runtime smoke report is malformed.");
                EditorApplication.update -= PollSmoke;
                SessionState.SetBool("FateSmokeActive", false);
                Debug.Log("RUNTIME_SMOKE_" + (report.passed ? "PASS" : "FAIL") + ": " + path);
                EditorApplication.Exit(report.passed ? 0 : 1);
            }
            catch (Exception exception)
            {
                EditorApplication.update -= PollSmoke;
                Debug.LogException(exception);
                SessionState.SetBool("FateSmokeActive", false);
                EditorApplication.Exit(1);
            }
        }

        private static void Build(BuildTarget target, string relativeOutput)
        {
            if (!BuildPipeline.IsBuildTargetSupported(BuildPipeline.GetBuildTargetGroup(target), target))
                throw new InvalidOperationException("The editor is missing build support for " + target);
            string output = Path.GetFullPath(Path.Combine(Application.dataPath, "../../..", relativeOutput));
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions { scenes = Scenes, locationPathName = output, target = target, options = BuildOptions.Development });
            string reportPath = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../analysis/test-runs/unity", target + "-build.json"));
            Directory.CreateDirectory(Path.GetDirectoryName(reportPath));
            File.WriteAllText(reportPath, JsonUtility.ToJson(new BuildRecord { target = target.ToString(), output = output, result = report.summary.result.ToString(), bytes = report.summary.totalSize, errors = report.summary.totalErrors, duration = report.summary.totalTime.TotalSeconds }, true));
            if (report.summary.result != BuildResult.Succeeded) throw new InvalidOperationException("Build failed. See Unity log and " + reportPath);
            Debug.Log("BUILD_PASS: " + output + ". Installation and runtime acceptance have not been performed by this command.");
        }

        private static void RequireVersion()
        {
            if (Application.unityVersion != Version) throw new InvalidOperationException("Expected Unity " + Version + "; got " + Application.unityVersion);
        }

        [Serializable]
        private sealed class BuildRecord
        {
            public string target;
            public string output;
            public string result;
            public ulong bytes;
            public uint errors;
            public double duration;
        }

        [Serializable]
        private sealed class SmokeRecord
        {
            public bool passed;
        }
    }
}
