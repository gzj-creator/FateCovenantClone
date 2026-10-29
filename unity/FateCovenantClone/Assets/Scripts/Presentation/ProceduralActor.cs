using System.Collections;
using System.Collections.Generic;
using FateCovenant.Battle;
using UnityEngine;

namespace FateCovenant.Presentation
{
    public sealed class ProceduralActor : MonoBehaviour
    {
        public CharacterDefinition Definition { get; private set; }
        public string InstanceId { get; private set; }
        public int Hp { get; private set; }
        public int Rage { get; private set; }
        public int Shield { get; private set; }
        public int WarStacks { get; private set; }
        public bool IsDead { get; private set; }
        public Color Accent { get; private set; }
        public Vector3 Home { get; private set; }
        public Vector3 HitPoint { get { return transform.position + Vector3.up * 1.3f; } }

        private Transform body, head, rightArm, leftArm, rightLeg, leftLeg, weapon, shieldOrb, warRing;
        private Material cloth, metal, skin;
        private readonly List<Material> ownedMaterials = new List<Material>();
        private readonly List<Renderer> surfaces = new List<Renderer>();
        private float motion, hit, phase;
        private bool acting;
        private Quaternion facing;

        public static ProceduralActor Create(CharacterDefinition definition, string instanceId, Vector3 position, bool enemy)
        {
            GameObject root = new GameObject(definition.DisplayName);
            root.transform.position = position;
            root.transform.rotation = Quaternion.Euler(0, enemy ? 180 : 0, 0);
            ProceduralActor actor = root.AddComponent<ProceduralActor>();
            actor.Definition = definition;
            actor.InstanceId = instanceId;
            actor.Hp = definition.MaxHp;
            actor.Rage = 50;
            actor.Home = position;
            actor.facing = root.transform.rotation;
            actor.Accent = definition.Role == "Tank" ? new Color(0.18f, 0.65f, 0.88f)
                : definition.Role == "Support" ? new Color(0.23f, 0.8f, 0.51f) : new Color(0.9f, 0.23f, 0.32f);
            if (enemy) actor.Accent = Color.Lerp(actor.Accent, new Color(0.72f, 0.32f, 0.88f), 0.55f);
            actor.Build();
            return actor;
        }

        internal static Shader LitShader
        {
            get
            {
                Shader shader = Shader.Find("Universal Render Pipeline/Simple Lit");
                if (!shader) shader = Shader.Find("Standard");
                return shader;
            }
        }

        internal static Material Material(Color color)
        {
            Material result = new Material(LitShader);
            result.color = color;
            if (result.HasProperty("_Smoothness")) result.SetFloat("_Smoothness", 0.25f);
            return result;
        }

        private Material Own(Color color)
        {
            Material material = Material(color);
            ownedMaterials.Add(material);
            return material;
        }

        private Transform Joint(string label, Transform parent, Vector3 at)
        {
            Transform joint = new GameObject(label).transform;
            joint.SetParent(parent, false);
            joint.localPosition = at;
            return joint;
        }

        private Transform Part(string label, PrimitiveType shape, Transform parent, Vector3 at, Vector3 scale, Material material)
        {
            GameObject part = GameObject.CreatePrimitive(shape);
            part.name = label;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = at;
            part.transform.localScale = scale;
            Destroy(part.GetComponent<Collider>());
            Renderer surface = part.GetComponent<Renderer>();
            surface.sharedMaterial = material;
            surfaces.Add(surface);
            return part.transform;
        }

        private void Build()
        {
            phase = Home.x * 1.7f;
            cloth = Own(Accent);
            metal = Own(new Color(0.13f, 0.19f, 0.23f));
            skin = Own(new Color(0.98f, 0.77f, 0.65f));
            bool tank = Definition.Role == "Tank";
            bool support = Definition.Role == "Support";
            float width = tank ? 0.82f : 0.59f;
            body = Joint("Spine", transform, Vector3.up * 0.94f);
            Part("Jacket", PrimitiveType.Cube, body, new Vector3(0, 0.36f, 0), new Vector3(width, 0.75f, 0.42f), cloth);
            Part("Belt", PrimitiveType.Cube, body, Vector3.zero, new Vector3(width + 0.04f, 0.14f, 0.46f), metal);
            Part("Chest crest", PrimitiveType.Cube, body, new Vector3(0, 0.42f, 0.24f), new Vector3(0.15f, 0.22f, 0.09f), skin).localRotation = Quaternion.Euler(0, 0, 45);
            head = Joint("Head", body, new Vector3(0, 0.99f, 0));
            Part("Face", PrimitiveType.Sphere, head, Vector3.zero, new Vector3(0.48f, 0.54f, 0.43f), skin);
            Part("Hair", PrimitiveType.Sphere, head, new Vector3(0, 0.14f, -0.07f), new Vector3(0.51f, 0.38f, 0.43f), metal);
            Part("Eyes", PrimitiveType.Cube, head, new Vector3(0, 0, 0.208f), new Vector3(0.31f, 0.055f, 0.035f), metal);
            Part("Crown", PrimitiveType.Cube, head, new Vector3(0, 0.24f, 0.05f), new Vector3(0.53f, 0.1f, 0.39f), cloth);
            leftArm = Joint("Left shoulder", body, new Vector3(-width * 0.65f, 0.65f, 0));
            rightArm = Joint("Right shoulder", body, new Vector3(width * 0.65f, 0.65f, 0));
            Part("Left arm", PrimitiveType.Cube, leftArm, new Vector3(0, -0.32f, 0), new Vector3(0.22f, 0.65f, 0.24f), cloth);
            Part("Right arm", PrimitiveType.Cube, rightArm, new Vector3(0, -0.32f, 0), new Vector3(0.22f, 0.65f, 0.24f), cloth);
            Part("Left glove", PrimitiveType.Cube, leftArm, new Vector3(0, -0.65f, 0), Vector3.one * 0.25f, metal);
            Part("Right glove", PrimitiveType.Cube, rightArm, new Vector3(0, -0.65f, 0), Vector3.one * 0.25f, metal);
            leftLeg = Joint("Left hip", transform, new Vector3(-0.19f, 0.9f, 0));
            rightLeg = Joint("Right hip", transform, new Vector3(0.19f, 0.9f, 0));
            Part("Left leg", PrimitiveType.Cube, leftLeg, new Vector3(0, -0.34f, 0), new Vector3(0.25f, 0.68f, 0.28f), metal);
            Part("Right leg", PrimitiveType.Cube, rightLeg, new Vector3(0, -0.34f, 0), new Vector3(0.25f, 0.68f, 0.28f), metal);
            Part("Left boot", PrimitiveType.Cube, leftLeg, new Vector3(0, -0.79f, 0.08f), new Vector3(0.31f, 0.22f, 0.45f), cloth);
            Part("Right boot", PrimitiveType.Cube, rightLeg, new Vector3(0, -0.79f, 0.08f), new Vector3(0.31f, 0.22f, 0.45f), cloth);
            BuildCape(body, support ? 1.35f : 0.95f, width);
            weapon = Joint("Weapon anchor", rightArm, new Vector3(0, -0.6f, 0.1f));
            if (tank)
            {
                Part("Tower shield", PrimitiveType.Cube, leftArm, new Vector3(-0.12f, -0.36f, 0.32f), new Vector3(0.76f, 1.03f, 0.17f), metal);
                Part("Shield enamel", PrimitiveType.Cube, leftArm, new Vector3(-0.12f, -0.36f, 0.43f), new Vector3(0.44f, 0.7f, 0.08f), cloth);
                Part("Mace handle", PrimitiveType.Cylinder, weapon, new Vector3(0, 0.28f, 0), new Vector3(0.1f, 0.38f, 0.1f), metal);
                Part("Mace head", PrimitiveType.Cube, weapon, new Vector3(0, 0.78f, 0), Vector3.one * 0.35f, cloth);
            }
            else if (support)
            {
                Part("Staff shaft", PrimitiveType.Cylinder, weapon, new Vector3(0, 0.42f, 0), new Vector3(0.08f, 0.9f, 0.08f), metal);
                Part("Staff crystal", PrimitiveType.Cube, weapon, new Vector3(0, 1.49f, 0), new Vector3(0.31f, 0.48f, 0.31f), cloth).localRotation = Quaternion.Euler(0, 45, 20);
                Part("Hood", PrimitiveType.Sphere, head, new Vector3(0, 0.12f, -0.11f), new Vector3(0.64f, 0.64f, 0.45f), cloth);
            }
            else
            {
                Part("Sword grip", PrimitiveType.Cylinder, weapon, new Vector3(0, 0.09f, 0), new Vector3(0.11f, 0.2f, 0.11f), metal);
                Part("Crossguard", PrimitiveType.Cube, weapon, new Vector3(0, 0.33f, 0), new Vector3(0.53f, 0.08f, 0.13f), cloth);
                Part("Blade", PrimitiveType.Cube, weapon, new Vector3(0, 0.93f, 0), new Vector3(0.16f, 1.14f, 0.065f), skin);
                Part("Blade ridge", PrimitiveType.Cube, weapon, new Vector3(0.06f, 0.93f, 0.01f), new Vector3(0.035f, 1.1f, 0.07f), cloth);
            }
            shieldOrb = Ring("Aegis", Vector3.up * 1.2f, 1.02f, new Color(0.4f, 0.85f, 1), true);
            shieldOrb.gameObject.SetActive(false);
            warRing = Ring("War intent", Vector3.up * 0.09f, 0.85f, new Color(1, 0.8f, 0.25f), false);
            warRing.gameObject.SetActive(false);
        }

        private Transform Ring(string label, Vector3 center, float radius, Color color, bool vertical)
        {
            Transform root = Joint(label, transform, center);
            LineRenderer line = root.gameObject.AddComponent<LineRenderer>();
            Shader shader = Shader.Find("Universal Render Pipeline/Unlit");
            if (!shader) shader = Shader.Find("Sprites/Default");
            Material material = new Material(shader); material.color = color; ownedMaterials.Add(material);
            line.sharedMaterial = material; line.useWorldSpace = false; line.loop = true;
            line.positionCount = 40; line.startWidth = line.endWidth = 0.055f;
            for (int i = 0; i < line.positionCount; i++)
            {
                float a = i * Mathf.PI * 2 / line.positionCount;
                line.SetPosition(i, vertical ? new Vector3(Mathf.Cos(a) * radius, Mathf.Sin(a) * radius * 1.25f, 0)
                    : new Vector3(Mathf.Cos(a) * radius, 0, Mathf.Sin(a) * radius));
            }
            return root;
        }

        private void BuildCape(Transform parent, float length, float width)
        {
            Mesh mesh = new Mesh();
            mesh.name = "Authored cape";
            mesh.vertices = new[] { new Vector3(-width * 0.5f, 0.69f, -0.25f), new Vector3(width * 0.5f, 0.69f, -0.25f),
                new Vector3(-width * 0.8f, 0.69f - length, -0.48f), new Vector3(width * 0.8f, 0.69f - length, -0.48f) };
            mesh.triangles = new[] { 0, 1, 2, 2, 1, 3, 2, 1, 0, 3, 1, 2 };
            mesh.RecalculateNormals();
            GameObject cape = new GameObject("Cape", typeof(MeshFilter), typeof(MeshRenderer));
            cape.transform.SetParent(parent, false);
            cape.GetComponent<MeshFilter>().sharedMesh = mesh;
            cape.GetComponent<MeshRenderer>().sharedMaterial = cloth;
            surfaces.Add(cape.GetComponent<Renderer>());
        }

        private void Update()
        {
            float time = Time.time;
            float breath = Mathf.Sin(time * 2.5f + phase);
            if (!IsDead)
            {
                body.localPosition = new Vector3(0, 0.94f + breath * 0.025f, 0);
                body.localRotation = Quaternion.Euler(-hit * 20, Mathf.Sin(motion * Mathf.PI) * (acting ? 22 : 0), 0);
                head.localRotation = Quaternion.Euler(0, Mathf.Sin(time + phase) * 5, 0);
                rightArm.localRotation = Quaternion.Euler(acting ? -145 * Mathf.Sin(motion * Mathf.PI) : breath * 3, 0, acting ? -24 : -6);
                leftArm.localRotation = Quaternion.Euler(acting ? -45 * Mathf.Sin(motion * Mathf.PI) : -breath * 3, 0, 6);
                leftLeg.localRotation = Quaternion.Euler(acting ? Mathf.Sin(motion * Mathf.PI * 4) * 23 : 0, 0, 0);
                rightLeg.localRotation = Quaternion.Euler(acting ? -Mathf.Sin(motion * Mathf.PI * 4) * 23 : 0, 0, 0);
            }
            hit = Mathf.MoveTowards(hit, 0, Time.deltaTime * 6);
            if (warRing && warRing.gameObject.activeSelf) warRing.localRotation = Quaternion.Euler(0, time * 65, 0);
        }

        public IEnumerator Windup(Vector3 target, bool skill, float speed)
        {
            acting = true;
            Vector3 start = transform.position;
            Vector3 end = Definition.Role == "Support" || skill ? Home : Vector3.MoveTowards(target, Home, 1.4f);
            float duration = (skill ? 0.5f : 0.27f) / speed;
            for (float elapsed = 0; elapsed < duration; elapsed += Time.deltaTime)
            {
                motion = Mathf.Clamp01(elapsed / duration) * 0.5f;
                transform.position = Vector3.Lerp(start, end, Mathf.SmoothStep(0, 1, elapsed / duration));
                yield return null;
            }
            transform.position = end;
            motion = 0.5f;
        }

        public IEnumerator Recover(float speed)
        {
            Vector3 start = transform.position;
            float duration = 0.27f / speed;
            for (float elapsed = 0; elapsed < duration; elapsed += Time.deltaTime)
            {
                motion = 0.5f + Mathf.Clamp01(elapsed / duration) * 0.5f;
                transform.position = Vector3.Lerp(start, Home, elapsed / duration);
                yield return null;
            }
            transform.position = Home;
            acting = false;
            motion = 0;
        }

        public void SetActionState(int rage, int warStacks)
        {
            Rage = rage; WarStacks = warStacks;
            warRing.gameObject.SetActive(!IsDead && WarStacks >= 3);
        }
        public void SetHealth(int value) { Hp = Mathf.Clamp(value, 0, Definition.MaxHp); }
        public void SetShield(int value) { Shield = Mathf.Max(0, value); shieldOrb.gameObject.SetActive(!IsDead && Shield > 0); }
        public void React() { hit = 1; StartCoroutine(Flash()); }

        private IEnumerator Flash()
        {
            cloth.color = Color.white;
            yield return new WaitForSeconds(0.08f);
            cloth.color = Accent;
        }

        public void Die()
        {
            if (IsDead) return;
            IsDead = true;
            Hp = 0;
            shieldOrb.gameObject.SetActive(false); warRing.gameObject.SetActive(false);
            StartCoroutine(Fall());
        }

        public void SnapToRest()
        {
            StopAllCoroutines(); acting = false; motion = 0; hit = 0; cloth.color = Accent;
            transform.position = IsDead ? Home + Vector3.up * 0.22f : Home;
            transform.rotation = IsDead ? facing * Quaternion.Euler(-85, 0, 12) : facing;
        }

        private IEnumerator Fall()
        {
            Quaternion from = transform.rotation;
            Quaternion to = from * Quaternion.Euler(-85, 0, 12);
            for (float t = 0; t < 0.32f; t += Time.deltaTime)
            {
                transform.rotation = Quaternion.Slerp(from, to, t / 0.32f);
                transform.position = Vector3.Lerp(Home, Home + Vector3.up * 0.22f, t / 0.32f);
                yield return null;
            }
            transform.rotation = to;
        }

        private void OnDestroy()
        {
            foreach (Material material in ownedMaterials) if (material) Destroy(material);
            foreach (MeshFilter filter in GetComponentsInChildren<MeshFilter>(true))
                if (filter.sharedMesh && filter.sharedMesh.name == "Authored cape") Destroy(filter.sharedMesh);
        }
    }
}
