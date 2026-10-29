using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

internal static class Program
{
    private const string Key = "LocalAesKey12345";
    private const string Vector = "Egl63xPQYEcIY0RJ";

    private static string Hex(byte[] bytes)
    {
        return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
    }

    // Mirrors network AesUtil.AesEncrypt IL_0002..0076 without loading its assembly.
    private static byte[][] Encrypt(byte[] input)
    {
        byte[] early;
        byte[] final;
        using (Rijndael aes = Rijndael.Create())
        using (MemoryStream output = new MemoryStream())
        using (CryptoStream stream = new CryptoStream(output,
            aes.CreateEncryptor(Encoding.UTF8.GetBytes(Key.PadRight(16)), Encoding.UTF8.GetBytes(Vector.PadRight(16))),
            CryptoStreamMode.Write))
        {
            stream.Write(input, 0, input.Length);
            early = output.ToArray();
            stream.FlushFinalBlock();
            final = output.ToArray();
        }
        return new byte[][] { early, final };
    }

    // Mirrors network AesUtil.AesDecrypt IL_0002..00ae without target code.
    private static byte[] Decrypt(byte[] input)
    {
        using (Rijndael aes = Rijndael.Create())
        using (MemoryStream source = new MemoryStream(input))
        using (CryptoStream stream = new CryptoStream(source,
            aes.CreateDecryptor(Encoding.UTF8.GetBytes(Key.PadRight(16)), Encoding.UTF8.GetBytes(Vector.PadRight(16))),
            CryptoStreamMode.Read))
        using (MemoryStream output = new MemoryStream())
        {
            byte[] block = new byte[1024];
            int count;
            while ((count = stream.Read(block, 0, block.Length)) > 0) output.Write(block, 0, count);
            return output.ToArray();
        }
    }

    private static object DecryptResult(byte[] input)
    {
        try
        {
            return new { ok = true, plaintextHex = Hex(Decrypt(input)), exceptionType = (string)null };
        }
        catch (Exception error)
        {
            return new { ok = false, plaintextHex = (string)null, exceptionType = error.GetType().FullName };
        }
    }

    private static object Fixture(byte[] input, string name)
    {
        byte[][] output = Encrypt(input);
        return new
        {
            name,
            plaintextHex = Hex(input),
            plaintextBytes = input.Length,
            beforeFinalHex = Hex(output[0]),
            beforeFinalBytes = output[0].Length,
            afterFinalHex = Hex(output[1]),
            afterFinalBytes = output[1].Length,
            beforeFinalDecrypt = DecryptResult(output[0]),
            afterFinalDecrypt = DecryptResult(output[1])
        };
    }

    private static int Run()
    {
        List<object> fixtures = new List<object>();
        foreach (int length in new int[] { 0, 1, 15, 16, 17, 31, 32, 33, 64 })
        {
            byte[] input = new byte[length];
            for (int index = 0; index < length; index++) input[index] = (byte)index;
            fixtures.Add(Fixture(input, "byte_sequence_" + length));
        }
        fixtures.Add(Fixture(Encoding.UTF8.GetBytes("ClientVerify1234"), "client_verify_16_ascii"));
        using (Rijndael aes = Rijndael.Create())
        {
            Console.WriteLine(new JavaScriptSerializer().Serialize(new
            {
                schemaVersion = 1,
                scope = "Local reimplementation of inspected CIL; no target assembly or APK executed",
                profile = "dotnet-framework-rijndael-write-before-final",
                runtime = new
                {
                    clrVersion = Environment.Version.ToString(),
                    osVersion = Environment.OSVersion.ToString(),
                    processBits = IntPtr.Size * 8,
                    rijndaelType = aes.GetType().FullName,
                    mode = aes.Mode.ToString(),
                    padding = aes.Padding.ToString(),
                    blockSize = aes.BlockSize,
                    defaultKeySize = aes.KeySize
                },
                testKey = Key,
                fixedVector = Vector,
                fixtures
            }));
        }
        return 0;
    }

    public static int Main()
    {
        try { return Run(); }
        catch (Exception error)
        {
            Console.Error.WriteLine(error.GetType().FullName);
            Console.Error.WriteLine(error.Message);
            return 1;
        }
    }
}
