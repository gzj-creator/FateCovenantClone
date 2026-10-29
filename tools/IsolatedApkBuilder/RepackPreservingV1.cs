using System;
using System.IO;
using System.Security.Cryptography;
using ICSharpCode.SharpZipLib.Zip;

internal static class RepackPreservingV1
{
    private static string Hash(Stream stream)
    {
        using (SHA256 sha = SHA256.Create())
        {
            byte[] buffer = new byte[1024 * 1024];
            int count;
            while ((count = stream.Read(buffer, 0, buffer.Length)) > 0)
                sha.TransformBlock(buffer, 0, count, null, 0);
            sha.TransformFinalBlock(buffer, 0, 0);
            return BitConverter.ToString(sha.Hash).Replace("-", "").ToLowerInvariant();
        }
    }

    private static int Main(string[] args)
    {
        if (args.Length != 2)
        {
            Console.Error.WriteLine("Usage: RepackPreservingV1 <source-signed.apk> <output-apk>");
            return 2;
        }

        string sourcePath = Path.GetFullPath(args[0]);
        string outputPath = Path.GetFullPath(args[1]);
        if (sourcePath.Equals(outputPath, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("Source and output must differ.");
        if (File.Exists(outputPath)) throw new IOException("Output already exists; refusing to overwrite.");

        int entries = 0;
        using (ZipFile source = new ZipFile(sourcePath))
        using (FileStream outputFile = new FileStream(outputPath, FileMode.CreateNew, FileAccess.ReadWrite, FileShare.None, 1024 * 1024))
        using (ZipOutputStream output = new ZipOutputStream(outputFile))
        {
            output.IsStreamOwner = false;
            output.UseZip64 = UseZip64.Dynamic;
            output.SetLevel(6);

            foreach (ZipEntry sourceEntry in source)
            {
                if (!sourceEntry.IsFile && !sourceEntry.IsDirectory) continue;
                foreach (char value in sourceEntry.Name)
                    if (value > 0x7f) throw new InvalidDataException("Non-ASCII ZIP member cannot use the CP437 fallback: " + sourceEntry.Name);

                ZipEntry target = new ZipEntry(sourceEntry.Name);
                target.CompressionMethod = sourceEntry.CompressionMethod;
                target.DateTime = sourceEntry.DateTime;
                target.ExternalFileAttributes = sourceEntry.ExternalFileAttributes;
                target.Size = sourceEntry.Size;
                target.Crc = sourceEntry.Crc;
                target.IsUnicodeText = false;
                output.PutNextEntry(target);

                using (Stream input = source.GetInputStream(sourceEntry))
                    input.CopyTo(output);
                output.CloseEntry();
                entries++;
                if (entries % 1000 == 0) Console.Error.WriteLine("Repacked " + entries + " ZIP entries.");
            }
        }

        using (FileStream input = File.OpenRead(sourcePath))
        using (FileStream output = File.OpenRead(outputPath))
        {
            Console.WriteLine("{");
            Console.WriteLine("  \"source\": \"" + sourcePath.Replace("\\", "\\\\") + "\",");
            Console.WriteLine("  \"sourceSha256\": \"" + Hash(input) + "\",");
            Console.WriteLine("  \"output\": \"" + outputPath.Replace("\\", "\\\\") + "\",");
            Console.WriteLine("  \"outputBytes\": " + output.Length + ",");
            Console.WriteLine("  \"outputSha256\": \"" + Hash(output) + "\",");
            Console.WriteLine("  \"entries\": " + entries);
            Console.WriteLine("}");
        }
        return 0;
    }
}
