using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace FateCovenant.Presentation
{
    public sealed class ArenaView : MonoBehaviour
    {
        public Camera Camera { get; private set; }
        private readonly List<Material> materials = new List<Material>();
        private readonly List<GameObject> transientEffects = new List<GameObject>();
        private Vector3 cameraHome;
        private Quaternion cameraRotation;
        private AudioSource audioSource;
        private AudioClip impact, skillCue;

        public static ArenaView Create(bool battle)
        {
            ArenaView arena = new GameObject("Arena").AddComponent<ArenaView>();
            arena.Build(battle);
            return arena;
        }

        private Material Surface(Color color)
        {
            Material material = ProceduralActor.Material(color);
            materials.Add(material);
            return material;
        }

        private void Block(string label, Vector3 position, Vector3 scale, Material material, PrimitiveType type = PrimitiveType.Cube)
        {
            GameObject block = GameObject.CreatePrimitive(type);
            block.name = label;
            block.transform.SetParent(transform, false);
            block.transform.localPosition = position;
            block.transform.localScale = scale;
            block.GetComponent<Renderer>().sharedMaterial = material;
            Destroy(block.GetComponent<Collider>());
        }

        private void Build(bool battle)
        {
            RenderSettings.ambientLight = new Color(0.58f, 0.64f, 0.67f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.19f, 0.26f, 0.29f);
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogStartDistance = 30;
            RenderSettings.fogEndDistance = 65;
            Material stone = Surface(new Color(0.32f, 0.4f, 0.43f));
            Material edge = Surface(new Color(0.13f, 0.22f, 0.24f));
            Material tile = Surface(new Color(0.46f, 0.53f, 0.54f));
            Material white = Surface(new Color(0.72f, 0.79f, 0.76f));
            Material teal = Surface(new Color(0.13f, 0.64f, 0.62f));
            Block("Arena foundation", new Vector3(0, -0.55f, 0), new Vector3(20, 0.8f, 19), edge);
            Block("Battle platform", new Vector3(0, -0.1f, 0), new Vector3(18, 0.3f, 17), stone);
            for (int x = -4; x <= 4; x++)
                for (int z = -4; z <= 4; z++)
                    Block("Paving", new Vector3(x * 1.96f, 0.061f, z * 1.82f), new Vector3(1.89f, 0.024f, 1.75f), ((x + z) & 1) == 0 ? tile : stone);
            for (int i = 0; i < 8; i++)
            {
                float x = (i % 2 == 0 ? -1 : 1) * 10.5f;
                float z = (i / 2) * 5 - 6;
                Block("Column base", new Vector3(x, 0, z), new Vector3(1.8f, 0.6f, 1.8f), edge);
                Block("Column", new Vector3(x, 2.4f, z), new Vector3(0.8f, 4.7f, 0.8f), white);
                Block("Column cap", new Vector3(x, 4.8f, z), new Vector3(1.3f, 0.3f, 1.3f), teal);
                Block("Floating buttress", new Vector3(x * 1.4f, -2, z + 8), new Vector3(3, 6, 3), edge);
            }
            Block("Rear arch beam", new Vector3(0, 5.3f, 13), new Vector3(20, 0.8f, 1.1f), white);
            Block("Distant island", new Vector3(0, -3, 22), new Vector3(28, 3, 9), edge);
            GameObject sun = new GameObject("Key light", typeof(Light));
            sun.transform.SetParent(transform);
            sun.transform.rotation = Quaternion.Euler(48, -38, 0);
            Light light = sun.GetComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(1, 0.94f, 0.85f);
            light.intensity = 1.7f;
            light.shadows = LightShadows.None;
            GameObject camera = new GameObject("Battle camera", typeof(Camera), typeof(AudioListener));
            camera.tag = "MainCamera";
            camera.transform.SetParent(transform);
            Camera = camera.GetComponent<Camera>();
            Camera.clearFlags = CameraClearFlags.SolidColor;
            Camera.backgroundColor = RenderSettings.fogColor;
            Camera.nearClipPlane = 0.1f;
            Camera.farClipPlane = 90;
            Camera.orthographic = true;
            Camera.orthographicSize = battle ? 10.4f : 3.0f;
            cameraHome = battle ? new Vector3(0, 18, -22) : new Vector3(0, 9, -14);
            camera.transform.position = cameraHome;
            camera.transform.LookAt(battle ? new Vector3(0, 0.7f, 0) : new Vector3(0, 1.1f, 0));
            cameraRotation = camera.transform.rotation;
            audioSource = gameObject.AddComponent<AudioSource>();
            impact = Tone("Original impact", 190, 0.09f);
            skillCue = Tone("Original skill cue", 540, 0.28f);
        }

        private static AudioClip Tone(string name, float frequency, float duration)
        {
            const int sampleRate = 22050;
            float[] samples = new float[(int)(sampleRate * duration)];
            for (int i = 0; i < samples.Length; i++)
            {
                float t = (float)i / sampleRate;
                samples[i] = Mathf.Sin(t * frequency * (1 - t) * Mathf.PI * 2) * 0.12f * Mathf.Pow(1 - t / duration, 2);
            }
            AudioClip clip = AudioClip.Create(name, samples.Length, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        public static Vector3 Slot(int slot, bool enemy)
        {
            return new Vector3((slot - 1) * 3.25f, 0.08f, enemy ? 3.5f : -3.5f);
        }

        public void ResetCamera()
        {
            Camera.transform.position = cameraHome;
            Camera.transform.rotation = cameraRotation;
        }

        public IEnumerator Focus(ProceduralActor actor, float speed)
        {
            audioSource.PlayOneShot(skillCue);
            Vector3 from = Camera.transform.position;
            Vector3 to = Vector3.Lerp(cameraHome, actor.HitPoint + new Vector3(0, 3, -6), 0.28f);
            for (float t = 0; t < 0.24f / speed; t += Time.deltaTime)
            {
                Camera.transform.position = Vector3.Lerp(from, to, t * speed / 0.24f);
                yield return null;
            }
        }

        public void Hit(Vector3 point, Color color, bool critical)
        {
            audioSource.PlayOneShot(impact, critical ? 1 : 0.6f);
            Pulse(point, color, critical ? 1.4f : 0.8f);
            StartCoroutine(Shake(critical ? 0.1f : 0.045f));
        }

        private IEnumerator Shake(float strength)
        {
            for (float t = 0; t < 0.09f; t += Time.deltaTime)
            {
                Camera.transform.position = cameraHome + new Vector3(Mathf.Sin(t * 210) * strength, Mathf.Cos(t * 270) * strength, 0);
                yield return null;
            }
            ResetCamera();
        }

        public void Pulse(Vector3 point, Color color, float size)
        {
            GameObject effect = new GameObject("Impact ring", typeof(LineRenderer));
            transientEffects.Add(effect);
            effect.transform.SetParent(transform);
            LineRenderer line = effect.GetComponent<LineRenderer>();
            Shader shader = Shader.Find("Universal Render Pipeline/Unlit");
            if (!shader) shader = Shader.Find("Sprites/Default");
            Material material = new Material(shader);
            materials.Add(material);
            material.color = color;
            line.sharedMaterial = material;
            line.loop = true;
            line.positionCount = 40;
            line.startWidth = line.endWidth = 0.08f;
            StartCoroutine(Expand(effect, line, material, point, size));
        }

        private IEnumerator Expand(GameObject effect, LineRenderer line, Material material, Vector3 point, float size)
        {
            for (float t = 0; t < 0.45f; t += Time.deltaTime)
            {
                float radius = size * (0.2f + t * 3);
                line.startWidth = line.endWidth = 0.12f * (1 - t / 0.45f);
                for (int i = 0; i < line.positionCount; i++)
                {
                    float a = i * Mathf.PI * 2 / line.positionCount;
                    line.SetPosition(i, point + new Vector3(Mathf.Cos(a) * radius, 0, Mathf.Sin(a) * radius));
                }
                yield return null;
            }
            Destroy(material);
            materials.Remove(material);
            Destroy(effect);
            transientEffects.Remove(effect);
        }

        public IEnumerator Bolt(Vector3 from, Vector3 to, Color color, float speed)
        {
            GameObject bolt = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            transientEffects.Add(bolt);
            bolt.name = "Petal bolt";
            bolt.transform.SetParent(transform);
            Destroy(bolt.GetComponent<Collider>());
            Material material = ProceduralActor.Material(color);
            materials.Add(material);
            bolt.GetComponent<Renderer>().sharedMaterial = material;
            bolt.transform.localScale = Vector3.one * 0.24f;
            for (float t = 0; t < 0.18f / speed; t += Time.deltaTime)
            {
                bolt.transform.position = Vector3.Lerp(from, to, t * speed / 0.18f);
                yield return null;
            }
            Destroy(material);
            materials.Remove(material);
            Destroy(bolt);
            transientEffects.Remove(bolt);
        }

        public void StopEffects()
        {
            StopAllCoroutines();
            foreach (GameObject effect in transientEffects) if (effect)
            {
                Renderer renderer = effect.GetComponent<Renderer>();
                if (renderer && renderer.sharedMaterial)
                {
                    materials.Remove(renderer.sharedMaterial);
                    Destroy(renderer.sharedMaterial);
                }
                Destroy(effect);
            }
            transientEffects.Clear();
            ResetCamera();
        }

        private void OnDestroy()
        {
            foreach (Material material in materials) if (material) Destroy(material);
            if (impact) Destroy(impact);
            if (skillCue) Destroy(skillCue);
        }
    }
}
