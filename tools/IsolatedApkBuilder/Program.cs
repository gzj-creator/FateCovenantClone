using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ICSharpCode.SharpZipLib.Zip;
using ICSharpCode.SharpZipLib.Checksum;

internal static class Program
{
    private const string ExpectedSourceSha256 = "b724dfbaa5687ebbfc9ce1b930e9bd88ca74f9b6afc3838d1e20acf66cd8ba5e";
    private const string ExpectedWalletSourceSha256 = "37ba1ff04566cf3a1fa5a8ee16103589f459e62d60619bd1dcc9a2cc96b309e3";
    private const string ExpectedWalletDexEntrySha256 = "7593e3b4343ad0216b904f44290f3dc34441ccbb7221ea8b26559463166d89aa";
    private const string ExpectedWalletLuaEntrySha256 = "fd1fa8b504d080eb7fbb7a91b5390041fd38af896cdca2f4a8a57d1c10236cda";
    private const string ExpectedWalletLanguageEntrySha256 = "e11100a963483589fe51642bf39fe9131a90283cb37504961c233e8e20c417a5";
    private const string ExpectedPatchedLuaBundleSha256 = "90595989c0d3dc93b0fa6e741a334b1b4ec7432153addd9ca451593e23782012";
    private const string ExpectedPatchedLanguageBundleSha256 = "fafdbe68c795dba8e40dd210a8524669386be3244d94a515157f9c70adf65b64";
    private static readonly Encoding Utf8 = new UTF8Encoding(false, true);
    private static readonly string[] ControlledFields = { "Host", "ListPorts", "UpdateAddr", "AppDownloadAddr" };
    private static readonly Dictionary<string, string> Renames = BuildRenames();

    private sealed class EntryRecord
    {
        public string name;
        public string action;
        public ushort sourceFlags;
        public ushort outputFlags;
        public long sourceBytes;
        public long outputBytes;
        public ushort sourceCompressionMethod;
        public ushort outputCompressionMethod;
        public string sourceSha256;
        public string outputSha256;
    }

    private sealed class CentralEntry
    {
        public string Name;
        public ushort Method;
        public ushort Flags;
        public uint Crc;
    }

    private sealed class StringRecord
    {
        public int Index;
        public string Text;
        public int PayloadStart;
        public int PayloadBytes;
        public bool Utf8;
    }

    private static Dictionary<string, string> BuildRenames()
    {
        Dictionary<string, string> result = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (string suffix in new string[] { "", ".fileprovider", ".unicorn.fileprovider", ".qiyukf.ipc.provider.preference",
            ".tap_config.provider", ".tap_user.provider", ".wxapi.WXEntryActivity", ".wxapi.WXPayEntryActivity" })
            result.Add("com.jzyx.my" + suffix, "com.jzyx.ps" + suffix);
        foreach (string suffix in new string[] { "fileProvider", "okdownload" })
            result.Add("com.jzyx.acmeis.com.taptap.services.update." + suffix, "com.jzyx.fctest.com.taptap.services.update." + suffix);
        return result;
    }

    private static string Hash(byte[] bytes)
    {
        using (SHA256 sha = SHA256.Create()) return Hex(sha.ComputeHash(bytes));
    }

    private static string Hex(byte[] bytes)
    {
        return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
    }

    private static byte[] FromHex(string value)
    {
        Require(value.Length > 0 && (value.Length & 1) == 0, "Hex input must contain complete bytes.");
        return Enumerable.Range(0, value.Length / 2)
            .Select(index => Convert.ToByte(value.Substring(index * 2, 2), 16)).ToArray();
    }

    private static string HashStream(Stream stream)
    {
        using (SHA256 sha = SHA256.Create()) return Hex(sha.ComputeHash(stream));
    }

    private static string CopyAndHash(Stream source, Stream destination)
    {
        using (SHA256 sha = SHA256.Create())
        {
            byte[] buffer = new byte[1024 * 1024];
            int count;
            while ((count = source.Read(buffer, 0, buffer.Length)) > 0)
            {
                sha.TransformBlock(buffer, 0, count, buffer, 0);
                destination.Write(buffer, 0, count);
            }
            sha.TransformFinalBlock(buffer, 0, 0);
            return Hex(sha.Hash);
        }
    }

    private static byte[] ReadEntry(ZipArchiveEntry entry, int maximum)
    {
        if (entry.Length < 0 || entry.Length > maximum) throw new InvalidDataException("Selected entry exceeds local parse bound: " + entry.FullName);
        using (Stream source = entry.Open())
        using (MemoryStream output = new MemoryStream()) { source.CopyTo(output); return output.ToArray(); }
    }

    private static ushort U16(byte[] bytes, int offset) { return BitConverter.ToUInt16(bytes, offset); }
    private static uint U32(byte[] bytes, int offset) { return BitConverter.ToUInt32(bytes, offset); }
    private static ulong U64(byte[] bytes, int offset) { return BitConverter.ToUInt64(bytes, offset); }
    private static void Require(bool condition, string message) { if (!condition) throw new InvalidDataException(message); }
    private static byte[] PatchResourcePackage(byte[] input, out JArray changes)
    {
        Require(input.Length >= 12 && U16(input, 0) == 0x0002 && U32(input, 4) == input.Length, "Invalid resource table header.");
        byte[] output = (byte[])input.Clone();
        changes = new JArray();
        int offset = U16(input, 2);
        while (offset < input.Length)
        {
            Require(offset <= input.Length - 8, "Truncated resource chunk.");
            int header = U16(input, offset + 2);
            uint size = U32(input, offset + 4);
            Require(header >= 8 && size >= header && size <= input.Length - offset, "Invalid resource chunk bounds.");
            if (U16(input, offset) == 0x0200)
            {
                Require(header >= 268, "Truncated resource package header.");
                string name = Encoding.Unicode.GetString(input, offset + 12, 256).TrimEnd('\0');
                if (name == "com.jzyx.my")
                {
                    byte[] replacement = Encoding.Unicode.GetBytes("com.jzyx.ps");
                    Array.Clear(output, offset + 12, 256);
                    Buffer.BlockCopy(replacement, 0, output, offset + 12, replacement.Length);
                    changes.Add(Obj("source", name, "output", "com.jzyx.ps", "byteOffset", offset + 12,
                        "packageId", U32(input, offset + 8), "fieldBytes", 256));
                }
            }
            offset += (int)size;
        }
        Require(offset == input.Length && changes.Count == 1, "Expected exactly one source resource package.");
        return output;
    }
    private static JObject Obj(params object[] fields)
    {
        JObject value = new JObject();
        for (int index = 0; index < fields.Length; index += 2)
            value.Add((string)fields[index], fields[index + 1] as JToken ?? JToken.FromObject(fields[index + 1]));
        return value;
    }

    private static List<CentralEntry> ReadCentralDirectory(FileStream file)
    {
        int tailSize = (int)Math.Min(file.Length, 65557L);
        byte[] tail = new byte[tailSize];
        file.Position = file.Length - tailSize;
        ReadExactly(file, tail);
        int eocd = -1;
        for (int index = tail.Length - 22; index >= 0; index--)
            if (U32(tail, index) == 0x06054b50 && index + 22 + U16(tail, index + 20) == tail.Length) { eocd = index; break; }
        Require(eocd >= 0, "ZIP end record not found.");
        Require(U16(tail, eocd + 4) == 0 && U16(tail, eocd + 6) == 0, "Multi-volume ZIP is unsupported.");
        ulong count = U16(tail, eocd + 10);
        ulong centralOffset = U32(tail, eocd + 16);
        if (count == 0xffff || centralOffset == 0xffffffff)
        {
            long endOffset = file.Length - tailSize + eocd;
            Require(endOffset >= 20, "ZIP64 locator is absent.");
            file.Position = endOffset - 20;
            byte[] locator = new byte[20]; ReadExactly(file, locator);
            Require(U32(locator, 0) == 0x07064b50, "ZIP64 locator is invalid.");
            file.Position = checked((long)U64(locator, 8));
            byte[] record = new byte[56]; ReadExactly(file, record);
            Require(U32(record, 0) == 0x06064b50, "ZIP64 end record is invalid.");
            count = U64(record, 32);
            centralOffset = U64(record, 48);
        }
        Require(count <= 100000, "Too many ZIP members for this bounded builder.");
        file.Position = checked((long)centralOffset);
        List<CentralEntry> entries = new List<CentralEntry>();
        HashSet<string> names = new HashSet<string>(StringComparer.Ordinal);
        for (ulong index = 0; index < count; index++)
        {
            byte[] header = new byte[46]; ReadExactly(file, header);
            Require(U32(header, 0) == 0x02014b50, "ZIP central directory entry is invalid.");
            ushort flags = U16(header, 8);
            Require((flags & 1) == 0, "Encrypted ZIP members are unsupported.");
            ushort method = U16(header, 10);
            Require(method == 0 || method == 8, "Only stored or deflated ZIP members are supported.");
            byte[] nameBytes = new byte[U16(header, 28)]; ReadExactly(file, nameBytes);
            string name = ((flags & 0x800) != 0 ? Utf8 : Encoding.GetEncoding(437)).GetString(nameBytes);
            Require(names.Add(name), "Duplicate ZIP member: " + name);
            file.Seek(U16(header, 30) + U16(header, 32), SeekOrigin.Current);
            entries.Add(new CentralEntry { Name = name, Method = method, Flags = flags, Crc = U32(header, 16) });
        }
        file.Position = 0;
        return entries;
    }

    private static void ReadExactly(Stream stream, byte[] bytes)
    {
        int position = 0;
        while (position < bytes.Length)
        {
            int count = stream.Read(bytes, position, bytes.Length - position);
            if (count == 0) throw new EndOfStreamException();
            position += count;
        }
    }

    private static int StringLength8(byte[] bytes, ref int position, int end)
    {
        Require(position < end, "Truncated UTF-8 AXML string length.");
        int length = bytes[position++];
        if ((length & 0x80) == 0) return length;
        Require(position < end, "Truncated UTF-8 AXML string length.");
        return ((length & 0x7f) << 8) | bytes[position++];
    }

    private static int StringLength16(byte[] bytes, ref int position, int end)
    {
        Require(position + 2 <= end, "Truncated UTF-16 AXML string length.");
        int length = U16(bytes, position); position += 2;
        if ((length & 0x8000) == 0) return length;
        Require(position + 2 <= end, "Truncated UTF-16 AXML string length.");
        int rest = U16(bytes, position); position += 2;
        return ((length & 0x7fff) << 16) | rest;
    }

    private static List<StringRecord> ParseStringPool(byte[] bytes)
    {
        Require(bytes.Length >= 8 && U16(bytes, 0) == 3 && U16(bytes, 2) == 8 && U32(bytes, 4) == bytes.Length, "Expected binary Android XML document.");
        List<StringRecord> result = null;
        int position = 8;
        while (position < bytes.Length)
        {
            Require(position + 8 <= bytes.Length, "Truncated Android XML chunk.");
            int type = U16(bytes, position), headerSize = U16(bytes, position + 2);
            int size = checked((int)U32(bytes, position + 4));
            Require(headerSize >= 8 && size >= headerSize && position + size <= bytes.Length, "Invalid Android XML chunk range.");
            if (type == 1)
            {
                Require(result == null && headerSize >= 28, "Expected exactly one valid XML string pool.");
                int count = checked((int)U32(bytes, position + 8));
                int styleCount = checked((int)U32(bytes, position + 12));
                bool utf8 = (U32(bytes, position + 16) & 0x100) != 0;
                int dataStart = checked(position + (int)U32(bytes, position + 20));
                Require(count <= 100000 && position + headerSize + (count + styleCount) * 4 <= dataStart && dataStart <= position + size, "Invalid string pool table.");
                result = new List<StringRecord>();
                for (int index = 0; index < count; index++)
                {
                    int cursor = checked(dataStart + (int)U32(bytes, position + headerSize + index * 4));
                    Require(cursor >= dataStart && cursor < position + size, "Invalid AXML string offset.");
                    int units = utf8 ? StringLength8(bytes, ref cursor, position + size) : StringLength16(bytes, ref cursor, position + size);
                    int payloadBytes = utf8 ? StringLength8(bytes, ref cursor, position + size) : checked(units * 2);
                    int terminatorBytes = utf8 ? 1 : 2;
                    Require(cursor + payloadBytes + terminatorBytes <= position + size, "AXML string exceeds pool.");
                    string text = (utf8 ? Utf8 : Encoding.Unicode).GetString(bytes, cursor, payloadBytes);
                    Require(text.Length == units, "AXML UTF-16 unit length mismatch.");
                    Require(bytes[cursor + payloadBytes] == 0 && (utf8 || bytes[cursor + payloadBytes + 1] == 0), "AXML string terminator missing.");
                    result.Add(new StringRecord { Index = index, Text = text, PayloadStart = cursor, PayloadBytes = payloadBytes, Utf8 = utf8 });
                }
            }
            position += size;
        }
        Require(position == bytes.Length && result != null, "AXML chunk/pool validation failed.");
        return result;
    }

    private static byte[] PatchManifest(byte[] original, out JArray changes)
    {
        byte[] output = (byte[])original.Clone();
        List<StringRecord> strings = ParseStringPool(original);
        changes = new JArray();
        foreach (KeyValuePair<string, string> rename in Renames)
        {
            List<StringRecord> matches = strings.Where(value => value.Text == rename.Key).ToList();
            Require(matches.Count == 1, "Expected one exact AXML string: " + rename.Key);
            StringRecord match = matches[0];
            byte[] replacement = (match.Utf8 ? Utf8 : Encoding.Unicode).GetBytes(rename.Value);
            Require(rename.Key.Length == rename.Value.Length && replacement.Length == match.PayloadBytes, "AXML replacement must be exactly equal length.");
            Buffer.BlockCopy(replacement, 0, output, match.PayloadStart, replacement.Length);
            changes.Add(Obj("stringPoolIndex", match.Index, "source", rename.Key, "output", rename.Value,
                "byteOffset", match.PayloadStart, "byteLength", match.PayloadBytes));
        }
        List<StringRecord> after = ParseStringPool(output);
        foreach (StringRecord value in strings)
        {
            string expected;
            if (!Renames.TryGetValue(value.Text, out expected)) expected = value.Text;
            Require(after[value.Index].Text == expected, "Unexpected AXML string change.");
        }
        return output;
    }

    private static byte[] PatchGameConfig(byte[] original)
    {
        JObject config = JObject.Parse(Utf8.GetString(original));
        config["Host"] = "127.0.0.1";
        config["ListPorts"] = "18881";
        config["UpdateAddr"] = "http://127.0.0.1:18882/update/res";
        config["AppDownloadAddr"] = "http://127.0.0.1:18882/update/app";
        return Utf8.GetBytes(config.ToString(Formatting.Indented) + "\n");
    }

    private static byte[] LocalSdkConfig()
    {
        string source = Environment.GetEnvironmentVariable("FC_LOCAL_SDK_XML");
        if (String.IsNullOrEmpty(source)) return null;
        XDocument document = XDocument.Load(source);
        Dictionary<string, string> changes = new Dictionary<string, string> {
            { "app_id", "fc-local" }, { "app_key", "fc-local-development-key" },
            { "game_id", "6" }, { "packName", "com.jzyx.ps" }, { "is_auto_login", "1" }
        };
        foreach (KeyValuePair<string, string> change in changes)
        {
            XElement element = document.Root.Elements("string").Single(x => (string)x.Attribute("name") == change.Key);
            element.Value = change.Value;
        }
        foreach (XElement element in document.Root.Elements("string"))
        {
            string name = (string)element.Attribute("name");
            if (name == "product_code") element.Value = "fc-local";
            if (name == "product_key") element.Value = "fclocal1";
            if (name == "callbackUrl" || name == "dataPut" || name == "trueNameCheck" || name == "quicksdk_server_ip_config")
                element.Value = "http://127.0.0.1:18880";
        }
        foreach (XElement item in document.Root.Elements("string-array").Single(x => (string)x.Attribute("name") == "quick_server_config").Elements("item"))
            item.Value = "http://127.0.0.1:18880";
        return Utf8.GetBytes(document.ToString());
    }

    private static bool IsSignature(string name)
    {
        if (!name.StartsWith("META-INF/", StringComparison.OrdinalIgnoreCase)) return false;
        string baseName = name.Substring("META-INF/".Length);
        if (baseName.IndexOf('/') >= 0) return false;
        string extension = Path.GetExtension(baseName);
        return baseName.Equals("MANIFEST.MF", StringComparison.OrdinalIgnoreCase)
            || baseName.StartsWith("SIG-", StringComparison.OrdinalIgnoreCase)
            || new string[] { ".SF", ".RSA", ".DSA", ".EC" }.Contains(extension.ToUpperInvariant());
    }

    private static byte[] LocalSdkDex(byte[] original)
    {
        Require(Hash(original) == "96cbab3e1b7f792cf8f2845381c518d1f7cf8dbe547e739c8e87759a249a3f49", "SDK DEX identity mismatch.");
        // getStartType, same instruction width: iget-object v0 -> const-string v0, common.
        int offset = 0x44f6f8;
        byte[] expected = { 0x54, 0x10, 0xf9, 0x4d, 0x11, 0x00 };
        Require(original.Skip(offset).Take(6).SequenceEqual(expected), "SDK getter instruction mismatch.");
        byte[] output = (byte[])original.Clone();
        byte[] replacement = { 0x1a, 0x00, 0xd9, 0x4f, 0x11, 0x00 };
        Array.Copy(replacement, 0, output, offset, replacement.Length);
        // JZRechargeService$d has just stored order_no from the successful
        // /pay/recharge/order response. Replace the Alipay credential branch
        // through the success return with a local success callback. v0 is
        // order_no, v1 is this anonymous listener, and field @0x535e is the
        // JZRechargeService instance.
        int completion = 0x488388;
        byte[] oldCompletion = FromHex("7100338800000C0354105E537110078B00000C006E203A8803001A039A516E20EAA932000C0254135E531A00DA786E20ECA902000C0271200A8B230054125D536E1058000200");
        Require(original.Skip(completion).Take(oldCompletion.Length).SequenceEqual(oldCompletion), "SDK local completion instructions mismatch.");
        byte[] localPrefix = FromHex("070254105D536E105800000054105E537110098B00000C006201C44D723041811002");
        Require(oldCompletion.Length == 70 && localPrefix.Length == 34, "SDK local completion patch width changed.");
        byte[] localCompletion = localPrefix.Concat(Enumerable.Repeat((byte)0, oldCompletion.Length - localPrefix.Length)).ToArray();
        Array.Copy(localCompletion, 0, output, completion, localCompletion.Length);
        using (SHA1 sha = SHA1.Create()) Array.Copy(sha.ComputeHash(output, 32, output.Length - 32), 0, output, 12, 20);
        Adler32 checksum = new Adler32();
        checksum.Update(output.Skip(12).ToArray());
        Array.Copy(BitConverter.GetBytes((uint)checksum.Value), 0, output, 8, 4);
        return output;
    }

    private static string MarkerName(string original, out JArray changes)
    {
        changes = new JArray();
        if (!original.StartsWith("META-INF/acmeis_", StringComparison.Ordinal)) return original;
        string[] fields = original.Substring("META-INF/".Length).Split(';');
        for (int index = 0; index < fields.Length; index++)
        {
            int equals = fields[index].IndexOf('=');
            if (equals < 0) continue;
            string key = fields[index].Substring(0, equals);
            if (!ControlledFields.Contains(key)) continue;
            string replacement = key == "Host" ? "127.0.0.1" : key == "ListPorts" ? "18881"
                : key == "UpdateAddr" ? "http:$$127.0.0.1:18882$update$res" : "http:$$127.0.0.1:18882$update$app";
            changes.Add(Obj("field", key, "source", fields[index].Substring(equals + 1), "output", replacement));
            fields[index] = key + "=" + replacement;
        }
        return "META-INF/" + String.Join(";", fields);
    }

    private static int Run(string[] args)
    {
        if (args.Length > 0 && args[0] == "--patch-wallet")
            return RunWalletPatch(args);
        if (args.Length > 0 && args[0] == "--patch-wallet-dex")
            return RunWalletDexPatch(args);
        Require(args.Length == 3 && (args[0] == "--inspect" || args[0] == "--build"), "Usage: builder --inspect|--build <source.apk> <new-output.apk>");
        string sourcePath = Path.GetFullPath(args[1]), outputPath = Path.GetFullPath(args[2]);
        Require(!sourcePath.Equals(outputPath, StringComparison.OrdinalIgnoreCase), "Source and output paths must differ.");
        Require(!File.Exists(outputPath), "Output already exists; refusing to overwrite.");
        string reportPath = Path.Combine(Path.GetDirectoryName(outputPath), "patch-manifest.json");
        Require(!File.Exists(reportPath), "Patch manifest already exists; refusing to overwrite.");
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
        List<EntryRecord> records = new List<EntryRecord>();
        JArray stringChanges, resourceChanges, markerChanges = new JArray();
        JObject report;
        using (FileStream sourceFile = new FileStream(sourcePath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024 * 1024))
        {
            string sourceHash = HashStream(sourceFile);
            Require(sourceHash == ExpectedSourceSha256, "Source APK hash does not match the preserved selected APK.");
            List<CentralEntry> central = ReadCentralDirectory(sourceFile);
            using (ZipArchive source = new ZipArchive(sourceFile, ZipArchiveMode.Read, true))
            {
                Require(source.Entries.Count == central.Count, "Central/ZipArchive entry count differs.");
                for (int index = 0; index < central.Count; index++) Require(source.Entries[index].FullName == central[index].Name, "Entry order/name mismatch.");
                ZipArchiveEntry manifest = source.GetEntry("AndroidManifest.xml"), gameConfig = source.GetEntry("assets/game_config.json"), resources = source.GetEntry("resources.arsc");
                Require(manifest != null && gameConfig != null && resources != null, "Required patch members are absent.");
                byte[] oldManifest = ReadEntry(manifest, 4 * 1024 * 1024), oldConfig = ReadEntry(gameConfig, 1024 * 1024);
                byte[] newManifest = PatchManifest(oldManifest, out stringChanges), newConfig = PatchGameConfig(oldConfig);
                byte[] oldResources = ReadEntry(resources, 64 * 1024 * 1024);
                byte[] newResources = PatchResourcePackage(oldResources, out resourceChanges);
                byte[] localSdk = LocalSdkConfig();
                byte[] localSdkDex = localSdk == null || Environment.GetEnvironmentVariable("FC_LOCAL_COMMON_LOGIN") != "1"
                    ? null : LocalSdkDex(ReadEntry(source.GetEntry("classes6.dex"), 64 * 1024 * 1024));
                JObject configObject = JObject.Parse(Utf8.GetString(newConfig));
                report = Obj("schemaVersion", 1, "recordedAtUtc", DateTime.UtcNow.ToString("o"),
                    "scope", "Offline isolated APK derivative; unsigned, not zipaligned, not installed or runtime validated",
                    "source", Obj("path", sourcePath, "bytes", sourceFile.Length, "sha256", sourceHash, "entries", central.Count),
                    "output", Obj("path", outputPath, "package", "com.jzyx.ps", "signed", false, "zipaligned", false, "deviceValidated", false),
                    "manifestStringChanges", stringChanges, "localGameConfig", new JObject(ControlledFields.Select(field => new JProperty(field, configObject[field]))),
                    "resourcePackageChanges", resourceChanges,
                    "markerEntries", new JArray(source.Entries.Where(entry => entry.FullName.StartsWith("META-INF/acmeis_", StringComparison.Ordinal)).Select(entry => entry.FullName)),
                    "markerChanges", markerChanges,
                    "removedSignatureEntries", new JArray(source.Entries.Where(entry => IsSignature(entry.FullName)).Select(entry => entry.FullName)),
                    "preservedClassNamePrefix", "com.jzyx.acmeis.", "sdkAssetPatched", localSdk != null, "dexPatched", localSdkDex != null,
                    "jsonParser", typeof(JObject).Assembly.FullName,
                    "compressionWriter", typeof(ZipOutputStream).Assembly.FullName,
                    "builderIdentity", Obj("executableSha256", HashFile(typeof(Program).Assembly.Location),
                        "jsonParserSha256", HashFile(typeof(JObject).Assembly.Location), "zipWriterSha256", HashFile(typeof(ZipOutputStream).Assembly.Location),
                        "clrVersion", Environment.Version.ToString()));
                if (args[0] == "--inspect") { Console.WriteLine(report.ToString(Formatting.Indented)); return 0; }
                using (FileStream outputFile = new FileStream(outputPath, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None, 1024 * 1024))
                using (ZipOutputStream output = new ZipOutputStream(outputFile))
                {
                    output.IsStreamOwner = false;
                    output.UseZip64 = UseZip64.Dynamic;
                    output.SetLevel(6);
                    for (int index = 0; index < source.Entries.Count; index++)
                    {
                        ZipArchiveEntry entry = source.Entries[index];
                        EntryRecord record = new EntryRecord { name = entry.FullName, sourceFlags = central[index].Flags,
                            sourceBytes = entry.Length, sourceCompressionMethod = central[index].Method };
                        if (IsSignature(entry.FullName))
                        {
                            using (Stream input = entry.Open()) record.sourceSha256 = HashStream(input);
                            record.action = "remove_signature";
                            records.Add(record);
                            continue;
                        }
                        JArray specificMarkerChanges;
                        string outputName = MarkerName(entry.FullName, out specificMarkerChanges);
                        if (specificMarkerChanges.Count > 0) markerChanges.Add(Obj("sourceName", entry.FullName, "outputName", outputName, "fields", specificMarkerChanges));
                        byte[] replacement = entry.FullName == "AndroidManifest.xml" ? newManifest : entry.FullName == "assets/game_config.json" ? newConfig : entry.FullName == "resources.arsc" ? newResources : entry.FullName == "assets/quicksdk.xml" ? localSdk : entry.FullName == "classes6.dex" ? localSdkDex : null;
                        uint crc = central[index].Crc;
                        if (replacement != null)
                        {
                            Crc32 checksum = new Crc32(); checksum.Update(replacement); crc = (uint)checksum.Value;
                        }
                        ZipEntry target = new ZipEntry(outputName);
                        target.CompressionMethod = (CompressionMethod)central[index].Method;
                        target.DateTime = entry.LastWriteTime.DateTime;
                        target.ExternalFileAttributes = entry.ExternalAttributes;
                        target.Size = replacement == null ? entry.Length : replacement.Length;
                        target.Crc = crc;
                        target.IsUnicodeText = (central[index].Flags & 0x0800) != 0;
                        output.PutNextEntry(target);
                        if (replacement == null)
                        {
                            using (Stream input = entry.Open()) record.sourceSha256 = CopyAndHash(input, output);
                            record.outputSha256 = record.sourceSha256;
                            record.outputBytes = record.sourceBytes;
                            record.action = outputName == entry.FullName ? "copy" : "rename_marker";
                        }
                        else
                        {
                            record.sourceSha256 = Hash(ReadEntry(entry, 64 * 1024 * 1024));
                            output.Write(replacement, 0, replacement.Length);
                            record.outputSha256 = Hash(replacement);
                            record.outputBytes = replacement.Length;
                            record.action = "patch";
                        }
                        output.CloseEntry();
                        records.Add(record);
                        if ((index + 1) % 1000 == 0) Console.Error.WriteLine("Copied " + (index + 1) + "/" + source.Entries.Count + " ZIP entries.");
                    }
                }
            }
        }
        using (FileStream outputFile = new FileStream(outputPath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024 * 1024))
        {
            report["output"]["bytes"] = outputFile.Length;
            report["output"]["sha256"] = HashStream(outputFile);
            List<CentralEntry> central = ReadCentralDirectory(outputFile);
            using (ZipArchive output = new ZipArchive(outputFile, ZipArchiveMode.Read, true))
            {
                List<EntryRecord> expected = records.Where(value => value.action != "remove_signature").ToList();
                Require(output.Entries.Count == expected.Count && central.Count == expected.Count, "Output member count mismatch.");
                for (int index = 0; index < expected.Count; index++)
                {
                    EntryRecord record = expected[index];
                    JArray unused;
                    string expectedName = MarkerName(record.name, out unused);
                    ZipArchiveEntry entry = output.Entries[index];
                    Require(entry.FullName == expectedName && central[index].Name == expectedName, "Output ZIP member name/order mismatch.");
                    Require(entry.Length == record.outputBytes, "Output member length mismatch: " + entry.FullName);
                    record.outputFlags = central[index].Flags;
                    Require((record.outputFlags & 0x0800) == (record.sourceFlags & 0x0800), "Output ZIP UTF-8 flag changed: " + entry.FullName);
                    record.outputCompressionMethod = central[index].Method;
                    Require(record.outputCompressionMethod == record.sourceCompressionMethod, "Output compression method changed: " + entry.FullName);
                    using (Stream input = entry.Open()) Require(HashStream(input) == record.outputSha256, "Output content hash mismatch: " + entry.FullName);
                }
            }
        }
        report["entries"] = JArray.FromObject(records);
        report["verification"] = Obj("sourceHashMatched", true, "allOutputEntryHashesMatched", true,
            "compressionMethodsPreserved", true, "utf8FlagsPreserved", true,
            "onlyExpectedManifestStringsChanged", true, "unsignedDerivativeOnly", true);
        File.WriteAllText(reportPath, report.ToString(Formatting.Indented) + "\n", new UTF8Encoding(false));
        Console.WriteLine(Obj("output", outputPath, "bytes", report["output"]["bytes"], "sha256", report["output"]["sha256"],
            "patchManifest", reportPath, "entryCount", records.Count).ToString(Formatting.Indented));
        return 0;
    }

    private static int RunWalletDexPatch(string[] args)
    {
        Require(args.Length == 3, "Usage: builder --patch-wallet-dex <original-classes6.dex> <new-output.dex>");
        string sourcePath = Path.GetFullPath(args[1]);
        string outputPath = Path.GetFullPath(args[2]);
        Require(!sourcePath.Equals(outputPath, StringComparison.OrdinalIgnoreCase), "Source and output paths must differ.");
        Require(!File.Exists(outputPath), "Output already exists; refusing to overwrite.");
        byte[] source = File.ReadAllBytes(sourcePath);
        byte[] output = LocalSdkDex(source);
        File.WriteAllBytes(outputPath, output);
        Console.WriteLine(Obj("source", sourcePath, "sourceSha256", Hash(source), "output", outputPath,
            "outputBytes", output.Length, "outputSha256", Hash(output)).ToString(Formatting.Indented));
        return 0;
    }

    private static int RunWalletPatch(string[] args)
    {
        Require(args.Length == 6, "Usage: builder --patch-wallet <source.apk> <new-output.apk> <patched-lua.bundle> <original-classes6.dex> <patched-language.bundle>");
        string sourcePath = Path.GetFullPath(args[1]);
        string outputPath = Path.GetFullPath(args[2]);
        string patchedBundlePath = Path.GetFullPath(args[3]);
        string originalDexPath = Path.GetFullPath(args[4]);
        string patchedLanguagePath = Path.GetFullPath(args[5]);
        Require(!sourcePath.Equals(outputPath, StringComparison.OrdinalIgnoreCase), "Source and output paths must differ.");
        Require(!File.Exists(outputPath), "Output already exists; refusing to overwrite.");
        string reportPath = Path.Combine(Path.GetDirectoryName(outputPath), "wallet-patch-manifest.json");
        Require(!File.Exists(reportPath), "Wallet patch manifest already exists; refusing to overwrite.");
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath));

        byte[] patchedBundle = File.ReadAllBytes(patchedBundlePath);
        Require(Hash(patchedBundle) == ExpectedPatchedLuaBundleSha256, "Patched Lua bundle identity mismatch.");
        byte[] patchedLanguageBundle = File.ReadAllBytes(patchedLanguagePath);
        Require(Hash(patchedLanguageBundle) == ExpectedPatchedLanguageBundleSha256, "Patched language bundle identity mismatch.");
        byte[] originalDex = File.ReadAllBytes(originalDexPath);
        byte[] patchedDex = LocalSdkDex(originalDex);

        List<EntryRecord> records = new List<EntryRecord>();
        JObject report;
        using (FileStream sourceFile = new FileStream(sourcePath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024 * 1024))
        {
            string sourceHash = HashStream(sourceFile);
            Require(sourceHash == ExpectedWalletSourceSha256, "V8B source APK hash does not match the preserved baseline.");
            List<CentralEntry> central = ReadCentralDirectory(sourceFile);
            using (ZipArchive source = new ZipArchive(sourceFile, ZipArchiveMode.Read, true))
            {
                Require(source.Entries.Count == central.Count, "Central/ZipArchive entry count differs.");
                for (int index = 0; index < central.Count; index++)
                    Require(source.Entries[index].FullName == central[index].Name, "Entry order/name mismatch.");

                ZipArchiveEntry sourceDex = source.GetEntry("classes6.dex");
                ZipArchiveEntry sourceBundle = source.GetEntry("assets/Android/script/lua/64_lua_project.bundle");
                ZipArchiveEntry sourceLanguage = source.GetEntry("assets/Android/sub_first/config/core/language.bundle");
                Require(sourceDex != null && sourceBundle != null && sourceLanguage != null, "Wallet patch target members are absent.");
                Require(Hash(ReadEntry(sourceDex, 64 * 1024 * 1024)) == ExpectedWalletDexEntrySha256, "V8B classes6.dex is not the expected wallet baseline.");
                Require(Hash(ReadEntry(sourceBundle, 128 * 1024 * 1024)) == ExpectedWalletLuaEntrySha256, "V8B Lua bundle is not the expected wallet baseline.");
                Require(Hash(ReadEntry(sourceLanguage, 16 * 1024 * 1024)) == ExpectedWalletLanguageEntrySha256, "V8B language bundle is not the expected baseline.");

                using (FileStream outputFile = new FileStream(outputPath, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None, 1024 * 1024))
                using (ZipOutputStream output = new ZipOutputStream(outputFile))
                {
                    output.IsStreamOwner = false;
                    output.UseZip64 = UseZip64.Dynamic;
                    output.SetLevel(6);
                    for (int index = 0; index < source.Entries.Count; index++)
                    {
                        ZipArchiveEntry entry = source.Entries[index];
                        EntryRecord record = new EntryRecord { name = entry.FullName, sourceFlags = central[index].Flags,
                            sourceBytes = entry.Length, sourceCompressionMethod = central[index].Method };
                        if (IsSignature(entry.FullName))
                        {
                            using (Stream input = entry.Open()) record.sourceSha256 = HashStream(input);
                            record.action = "remove_signature";
                            records.Add(record);
                            continue;
                        }

                        byte[] replacement = entry.FullName == "classes6.dex" ? patchedDex
                            : entry.FullName == "assets/Android/script/lua/64_lua_project.bundle" ? patchedBundle
                            : entry.FullName == "assets/Android/sub_first/config/core/language.bundle" ? patchedLanguageBundle : null;
                        uint crc = central[index].Crc;
                        if (replacement != null)
                        {
                            Crc32 checksum = new Crc32(); checksum.Update(replacement); crc = (uint)checksum.Value;
                        }
                        ZipEntry target = new ZipEntry(entry.FullName);
                        target.CompressionMethod = (CompressionMethod)central[index].Method;
                        target.DateTime = entry.LastWriteTime.DateTime;
                        target.ExternalFileAttributes = entry.ExternalAttributes;
                        target.Size = replacement == null ? entry.Length : replacement.Length;
                        target.Crc = crc;
                        target.IsUnicodeText = (central[index].Flags & 0x0800) != 0;
                        output.PutNextEntry(target);
                        if (replacement == null)
                        {
                            using (Stream input = entry.Open()) record.sourceSha256 = CopyAndHash(input, output);
                            record.outputSha256 = record.sourceSha256;
                            record.outputBytes = record.sourceBytes;
                            record.action = "copy";
                        }
                        else
                        {
                            using (Stream input = entry.Open()) record.sourceSha256 = HashStream(input);
                            output.Write(replacement, 0, replacement.Length);
                            record.outputSha256 = Hash(replacement);
                            record.outputBytes = replacement.Length;
                            record.action = "patch";
                        }
                        output.CloseEntry();
                        records.Add(record);
                        if ((index + 1) % 1000 == 0) Console.Error.WriteLine("Copied " + (index + 1) + "/" + source.Entries.Count + " ZIP entries.");
                    }
                }
            }
        }

        int patchedCount = 0;
        using (FileStream outputFile = new FileStream(outputPath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024 * 1024))
        {
            string outputHash = HashStream(outputFile);
            List<CentralEntry> central = ReadCentralDirectory(outputFile);
            using (ZipArchive output = new ZipArchive(outputFile, ZipArchiveMode.Read, true))
            {
                List<EntryRecord> expected = records.Where(value => value.action != "remove_signature").ToList();
                Require(output.Entries.Count == expected.Count && central.Count == expected.Count, "Output member count mismatch.");
                for (int index = 0; index < expected.Count; index++)
                {
                    EntryRecord record = expected[index];
                    ZipArchiveEntry entry = output.Entries[index];
                    Require(entry.FullName == record.name && central[index].Name == record.name, "Output ZIP member name/order mismatch.");
                    Require(entry.Length == record.outputBytes, "Output member length mismatch: " + entry.FullName);
                    record.outputFlags = central[index].Flags;
                    Require((record.outputFlags & 0x0800) == (record.sourceFlags & 0x0800), "Output ZIP UTF-8 flag changed: " + entry.FullName);
                    record.outputCompressionMethod = central[index].Method;
                    Require(record.outputCompressionMethod == record.sourceCompressionMethod, "Output compression method changed: " + entry.FullName);
                    using (Stream input = entry.Open()) Require(HashStream(input) == record.outputSha256, "Output content hash mismatch: " + entry.FullName);
                    if (record.action == "patch") patchedCount++;
                }
            }
            Require(patchedCount == 3, "Expected exactly three patched APK members.");
            report = Obj("schemaVersion", 1, "recordedAtUtc", DateTime.UtcNow.ToString("o"),
                "scope", "Incremental isolated wallet/signature APK; unsigned, not zipaligned, not installed or runtime validated",
                "source", Obj("path", sourcePath, "bytes", new FileInfo(sourcePath).Length, "sha256", ExpectedWalletSourceSha256),
                "patchedInputs", Obj("luaBundle", Obj("path", patchedBundlePath, "bytes", patchedBundle.Length, "sha256", Hash(patchedBundle)),
                    "originalDex", Obj("path", originalDexPath, "bytes", originalDex.Length, "sha256", Hash(originalDex)),
                    "languageBundle", Obj("path", patchedLanguagePath, "bytes", patchedLanguageBundle.Length, "sha256", Hash(patchedLanguageBundle))),
                "output", Obj("path", outputPath, "package", "com.jzyx.ps", "bytes", outputFile.Length, "sha256", outputHash,
                    "signed", false, "zipaligned", false, "deviceValidated", false),
                "removedSignatureEntries", new JArray(records.Where(value => value.action == "remove_signature").Select(value => value.name)),
                "entries", JArray.FromObject(records),
                "verification", Obj("sourceHashMatched", true, "allOutputEntryHashesMatched", true, "compressionMethodsPreserved", true,
                    "utf8FlagsPreserved", true, "exactPatchTargets", patchedCount, "unsignedDerivativeOnly", true));
        }
        File.WriteAllText(reportPath, report.ToString(Formatting.Indented) + "\n", new UTF8Encoding(false));
        Console.WriteLine(report.ToString(Formatting.Indented));
        return 0;
    }

    private static int Main(string[] args)
    {
        try { return Run(args); }
        catch (Exception error) { Console.Error.WriteLine(error.GetType().FullName + ": " + error.Message); return 1; }
    }

    private static string HashFile(string path)
    {
        using (FileStream file = File.OpenRead(path)) return HashStream(file);
    }
}
