using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace FateCovenant.Presentation
{
    internal static class UiFactory
    {
        internal static readonly Color Ink = new Color(0.08f, 0.11f, 0.12f, 0.97f);
        internal static readonly Color Paper = new Color(0.94f, 0.97f, 0.95f);
        internal static readonly Color Muted = new Color(0.65f, 0.74f, 0.73f);
        internal static readonly Color Mint = new Color(0.42f, 0.91f, 0.73f);
        private static Font font;

        internal static Font Font
        {
            get { if (!font) font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); return font; }
        }

        internal static RectTransform Rect(string name, Transform parent, Vector2 min, Vector2 max, Vector2 low, Vector2 high)
        {
            RectTransform rect = new GameObject(name, typeof(RectTransform)).GetComponent<RectTransform>();
            rect.SetParent(parent, false);
            rect.anchorMin = min; rect.anchorMax = max;
            rect.offsetMin = low; rect.offsetMax = high;
            return rect;
        }

        internal static RectTransform Band(string name, Transform parent, float top, float height, float left = 32, float right = 32)
        {
            return Rect(name, parent, new Vector2(0, 1), Vector2.one, new Vector2(left, -top - height), new Vector2(-right, -top));
        }

        internal static Image Fill(RectTransform rect, Color color)
        {
            Image image = rect.gameObject.AddComponent<Image>(); image.color = color; image.raycastTarget = false; return image;
        }

        internal static Text Label(Transform parent, string value, int size, Color color, TextAnchor alignment = TextAnchor.MiddleLeft)
        {
            RectTransform rect = Rect(value, parent, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            Text text = rect.gameObject.AddComponent<Text>();
            text.font = Font; text.text = value; text.fontSize = size; text.color = color; text.alignment = alignment;
            text.horizontalOverflow = HorizontalWrapMode.Wrap; text.verticalOverflow = VerticalWrapMode.Truncate;
            text.raycastTarget = false;
            return text;
        }

        internal static Button Button(RectTransform rect, string label, UnityAction action, bool primary = false)
        {
            Image image = rect.gameObject.AddComponent<Image>();
            image.color = primary ? Mint : new Color(0.18f, 0.24f, 0.25f);
            Button button = rect.gameObject.AddComponent<Button>(); button.targetGraphic = image;
            ColorBlock colors = button.colors; colors.highlightedColor = new Color(0.83f, 0.95f, 0.9f);
            colors.pressedColor = new Color(0.6f, 0.76f, 0.71f); colors.disabledColor = new Color(0.35f, 0.4f, 0.4f);
            button.colors = colors; button.onClick.AddListener(action);
            RectTransform inset = Rect("Label", rect, Vector2.zero, Vector2.one, new Vector2(16, 4), new Vector2(-16, -4));
            Label(inset, label, 28, primary ? Ink : Paper, TextAnchor.MiddleCenter);
            return button;
        }
    }
}
