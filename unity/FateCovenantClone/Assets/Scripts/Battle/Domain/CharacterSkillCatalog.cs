using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace FateCovenant.Battle
{
    public sealed class CharacterSkillCatalog
    {
        public readonly string RulesVersion;
        public readonly IList<CharacterDefinition> Characters;
        public readonly IList<CharacterDefinition> CatalogCharacters;

        private CharacterSkillCatalog(
            string rulesVersion,
            IList<CharacterDefinition> characters,
            IList<CharacterDefinition> catalogCharacters)
        {
            RulesVersion = rulesVersion ?? string.Empty;
            Characters = characters;
            CatalogCharacters = catalogCharacters;
        }

        public static CharacterSkillCatalog Parse(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new FormatException("Character skill catalog JSON is empty.");
            object rootValue = new JsonReader(json).Read();
            Dictionary<string, object> root = AsObject(rootValue, "root");
            int schemaVersion = Integer(root, "schemaVersion", -1);
            if (schemaVersion != 1)
                throw new FormatException("Unsupported character skill catalog schema: " + schemaVersion);

            List<object> characterValues = Array(root, "characters");
            List<CharacterDefinition> characters = new List<CharacterDefinition>();
            List<CharacterDefinition> visible = new List<CharacterDefinition>();
            HashSet<string> characterIds = new HashSet<string>(StringComparer.Ordinal);
            for (int characterIndex = 0; characterIndex < characterValues.Count; characterIndex++)
            {
                Dictionary<string, object> value = AsObject(characterValues[characterIndex], "characters[]");
                string id = String(value, "id", string.Empty);
                if (string.IsNullOrWhiteSpace(id) || !characterIds.Add(id))
                    throw new FormatException("Character IDs must be nonempty and unique: " + id);

                Dictionary<string, object> stats = Object(value, "stats");
                List<object> skillValues = Array(value, "skills");
                List<SkillDefinition> skills = new List<SkillDefinition>();
                HashSet<string> skillIds = new HashSet<string>(StringComparer.Ordinal);
                for (int skillIndex = 0; skillIndex < skillValues.Count; skillIndex++)
                {
                    SkillDefinition skill = ParseSkill(AsObject(skillValues[skillIndex], "skills[]"));
                    if (skillIds.Add(skill.Id)) skills.Add(skill);
                }

                CharacterDefinition definition = new CharacterDefinition(
                    id,
                    String(value, "name", id),
                    String(value, "role", "Unknown"),
                    Integer(stats, "maxHp", 0),
                    Integer(stats, "attack", 0),
                    Integer(stats, "defense", 0),
                    Integer(stats, "magicDefense", 0),
                    Integer(stats, "speed", 0),
                    Integer(value, "quality", 0),
                    Boolean(value, "catalogVisible", false),
                    skills);
                if (definition.MaxHp <= 0 || definition.Attack < 0 || definition.Defense < 0
                    || definition.MagicDefense < 0 || definition.Speed < 0)
                    throw new FormatException("Invalid combat stats for character " + id);
                if (definition.BasicSkill == null)
                    throw new FormatException("Character has no normal skill: " + id);
                characters.Add(definition);
                if (definition.CatalogVisible) visible.Add(definition);
            }

            return new CharacterSkillCatalog(
                String(root, "rulesVersion", string.Empty),
                characters.AsReadOnly(),
                visible.AsReadOnly());
        }

        private static SkillDefinition ParseSkill(Dictionary<string, object> value)
        {
            string id = String(value, "id", string.Empty);
            if (string.IsNullOrWhiteSpace(id)) throw new FormatException("Skill ID is required.");
            SkillCategory category = ParseEnum<SkillCategory>(String(value, "category", "Passive"), "category");
            List<SkillActionDefinition> actions = ParseActions(Array(value, "actions"));
            List<SkillTriggerDefinition> triggers = new List<SkillTriggerDefinition>();
            List<object> triggerValues = Array(value, "triggers");
            for (int index = 0; index < triggerValues.Count; index++)
            {
                Dictionary<string, object> triggerValue = AsObject(triggerValues[index], "triggers[]");
                BattleTriggerType trigger = ParseTrigger(String(triggerValue, "trigger", "BattleStarted"));
                triggers.Add(new SkillTriggerDefinition(
                    trigger,
                    Boolean(triggerValue, "once", false),
                    ParseActions(Array(triggerValue, "actions"))));
            }

            List<object> sources = Array(value, "source");
            List<string> sourceNames = new List<string>();
            for (int index = 0; index < sources.Count; index++)
                if (sources[index] is string) sourceNames.Add((string)sources[index]);
            return new SkillDefinition(
                id,
                String(value, "displayName", id),
                String(value, "description", string.Empty),
                category,
                Integer(value, "energyCost", 0),
                Boolean(value, "hasCutIn", false),
                String(value, "implementationStatus", string.Empty),
                string.Join(",", sourceNames.ToArray()),
                actions,
                triggers);
        }

        private static List<SkillActionDefinition> ParseActions(List<object> values)
        {
            List<SkillActionDefinition> result = new List<SkillActionDefinition>();
            for (int index = 0; index < values.Count; index++)
            {
                Dictionary<string, object> value = AsObject(values[index], "actions[]");
                SkillActionType type = ParseEnum<SkillActionType>(String(value, "type", string.Empty), "action type");
                SkillTargeting targeting = ParseEnum<SkillTargeting>(String(value, "target", "Self"), "target");
                StatusKind status = ParseEnum<StatusKind>(String(value, "status", "Custom"), "status");
                result.Add(new SkillActionDefinition(
                    type,
                    targeting,
                    Number(value, "power", 0f),
                    Integer(value, "hitCount", 1),
                    Integer(value, "duration", 0),
                    Integer(value, "amount", 0),
                    Number(value, "magnitude", 0f),
                    Integer(value, "stacks", 1),
                    status,
                    Number(value, "chance", 1f)));
            }
            return result;
        }

        private static BattleTriggerType ParseTrigger(string value)
        {
            if (string.Equals(value, "UltimateSkillCast", StringComparison.OrdinalIgnoreCase))
                return BattleTriggerType.UltimateCast;
            return ParseEnum<BattleTriggerType>(value, "trigger");
        }

        private static T ParseEnum<T>(string value, string field) where T : struct
        {
            try
            {
                return (T)Enum.Parse(typeof(T), value, true);
            }
            catch (Exception exception)
            {
                throw new FormatException("Invalid " + field + " value: " + value, exception);
            }
        }

        private static Dictionary<string, object> Object(Dictionary<string, object> value, string key)
        {
            object child;
            if (!value.TryGetValue(key, out child)) return new Dictionary<string, object>();
            return AsObject(child, key);
        }

        private static Dictionary<string, object> AsObject(object value, string field)
        {
            Dictionary<string, object> result = value as Dictionary<string, object>;
            if (result == null) throw new FormatException("Expected object at " + field);
            return result;
        }

        private static List<object> Array(Dictionary<string, object> value, string key)
        {
            object child;
            if (!value.TryGetValue(key, out child) || child == null) return new List<object>();
            List<object> result = child as List<object>;
            if (result == null) throw new FormatException("Expected array at " + key);
            return result;
        }

        private static string String(Dictionary<string, object> value, string key, string fallback)
        {
            object child;
            if (!value.TryGetValue(key, out child) || child == null) return fallback;
            return Convert.ToString(child, CultureInfo.InvariantCulture);
        }

        private static bool Boolean(Dictionary<string, object> value, string key, bool fallback)
        {
            object child;
            if (!value.TryGetValue(key, out child) || child == null) return fallback;
            if (child is bool) return (bool)child;
            bool result;
            return bool.TryParse(Convert.ToString(child, CultureInfo.InvariantCulture), out result) ? result : fallback;
        }

        private static int Integer(Dictionary<string, object> value, string key, int fallback)
        {
            object child;
            if (!value.TryGetValue(key, out child) || child == null) return fallback;
            if (child is double) return checked((int)Math.Round((double)child));
            int result;
            return int.TryParse(Convert.ToString(child, CultureInfo.InvariantCulture), NumberStyles.Integer,
                CultureInfo.InvariantCulture, out result) ? result : fallback;
        }

        private static float Number(Dictionary<string, object> value, string key, float fallback)
        {
            object child;
            if (!value.TryGetValue(key, out child) || child == null) return fallback;
            if (child is double) return (float)(double)child;
            float result;
            return float.TryParse(Convert.ToString(child, CultureInfo.InvariantCulture), NumberStyles.Float,
                CultureInfo.InvariantCulture, out result) ? result : fallback;
        }

        private sealed class JsonReader
        {
            private readonly string json;
            private int position;

            public JsonReader(string json)
            {
                this.json = json;
            }

            public object Read()
            {
                SkipWhitespace();
                object value = ReadValue();
                SkipWhitespace();
                if (position != json.Length)
                    throw Error("Unexpected trailing JSON content");
                return value;
            }

            private object ReadValue()
            {
                SkipWhitespace();
                if (position >= json.Length) throw Error("Unexpected end of JSON");
                char token = json[position];
                if (token == '{') return ReadObject();
                if (token == '[') return ReadArray();
                if (token == '"') return ReadString();
                if (token == 't') { Expect("true"); return true; }
                if (token == 'f') { Expect("false"); return false; }
                if (token == 'n') { Expect("null"); return null; }
                if (token == '-' || (token >= '0' && token <= '9')) return ReadNumber();
                throw Error("Unexpected token '" + token + "'");
            }

            private Dictionary<string, object> ReadObject()
            {
                Dictionary<string, object> result = new Dictionary<string, object>(StringComparer.Ordinal);
                position++;
                SkipWhitespace();
                if (TryRead('}')) return result;
                while (true)
                {
                    SkipWhitespace();
                    string key = ReadString();
                    SkipWhitespace();
                    if (!TryRead(':')) throw Error("Expected ':'");
                    result[key] = ReadValue();
                    SkipWhitespace();
                    if (TryRead('}')) return result;
                    if (!TryRead(',')) throw Error("Expected ','");
                }
            }

            private List<object> ReadArray()
            {
                List<object> result = new List<object>();
                position++;
                SkipWhitespace();
                if (TryRead(']')) return result;
                while (true)
                {
                    result.Add(ReadValue());
                    SkipWhitespace();
                    if (TryRead(']')) return result;
                    if (!TryRead(',')) throw Error("Expected ','");
                }
            }

            private string ReadString()
            {
                if (position >= json.Length || json[position] != '"') throw Error("Expected string");
                position++;
                StringBuilder result = new StringBuilder();
                while (position < json.Length)
                {
                    char value = json[position++];
                    if (value == '"') return result.ToString();
                    if (value != '\\')
                    {
                        result.Append(value);
                        continue;
                    }
                    if (position >= json.Length) throw Error("Incomplete string escape");
                    char escaped = json[position++];
                    if (escaped == '"' || escaped == '\\' || escaped == '/') result.Append(escaped);
                    else if (escaped == 'b') result.Append('\b');
                    else if (escaped == 'f') result.Append('\f');
                    else if (escaped == 'n') result.Append('\n');
                    else if (escaped == 'r') result.Append('\r');
                    else if (escaped == 't') result.Append('\t');
                    else if (escaped == 'u')
                    {
                        if (position + 4 > json.Length) throw Error("Incomplete unicode escape");
                        string hex = json.Substring(position, 4);
                        position += 4;
                        int code;
                        if (!int.TryParse(hex, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out code))
                            throw Error("Invalid unicode escape");
                        result.Append((char)code);
                    }
                    else throw Error("Unsupported string escape");
                }
                throw Error("Unterminated string");
            }

            private double ReadNumber()
            {
                int start = position;
                if (json[position] == '-') position++;
                while (position < json.Length && char.IsDigit(json[position])) position++;
                if (position < json.Length && json[position] == '.')
                {
                    position++;
                    while (position < json.Length && char.IsDigit(json[position])) position++;
                }
                if (position < json.Length && (json[position] == 'e' || json[position] == 'E'))
                {
                    position++;
                    if (position < json.Length && (json[position] == '+' || json[position] == '-')) position++;
                    while (position < json.Length && char.IsDigit(json[position])) position++;
                }
                double result;
                if (!double.TryParse(json.Substring(start, position - start), NumberStyles.Float,
                    CultureInfo.InvariantCulture, out result)) throw Error("Invalid number");
                return result;
            }

            private void Expect(string value)
            {
                if (position + value.Length > json.Length
                    || string.CompareOrdinal(json, position, value, 0, value.Length) != 0)
                    throw Error("Expected " + value);
                position += value.Length;
            }

            private bool TryRead(char value)
            {
                if (position >= json.Length || json[position] != value) return false;
                position++;
                return true;
            }

            private void SkipWhitespace()
            {
                while (position < json.Length && char.IsWhiteSpace(json[position])) position++;
            }

            private FormatException Error(string message)
            {
                return new FormatException(message + " at JSON offset " + position);
            }
        }
    }
}
