using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

internal static class Program
{
    private static string Hex(byte[] bytes) { return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant(); }

    private static object Fixture(byte[] input, byte[] iv, bool signature)
    {
        int padding = (16 - input.Length % 16) % 16;
        int prefix = signature ? 16 : 0;
        byte[] scratch = new byte[input.Length + padding + prefix];
        if (signature)
            using (MD5 md5 = MD5.Create()) Array.Copy(md5.ComputeHash(input), scratch, 16);
        Array.Copy(input, 0, scratch, prefix, input.Length);
        byte[] wire = new byte[1 + scratch.Length];
        wire[0] = (byte)padding;
        byte[] received = new byte[scratch.Length];
        using (Aes aes = Aes.Create())
        {
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.Zeros;
            aes.KeySize = 128;
            byte[] key = Encoding.UTF8.GetBytes("I4ifhpBoR5U2SasD");
            using (ICryptoTransform transform = aes.CreateEncryptor(key, iv))
                transform.TransformBlock(scratch, 0, scratch.Length, wire, 1);
            using (ICryptoTransform transform = aes.CreateDecryptor(key, iv))
                transform.TransformBlock(wire, 1, wire.Length - 1, received, 0);
        }
        Array.Resize(ref received, received.Length - padding);
        return new {
            ok = true,
            plaintextHex = Hex(input), signature, ivHex = Hex(iv), packetHex = Hex(wire),
            receivedHex = Hex(received), returnedBytes = wire.Length,
            convenienceAllocationBytes = input.Length + 16 - input.Length % 16 + prefix + 1
        };
    }

    private static object Attempt(byte[] input, byte[] iv, bool signature)
    {
        try { return Fixture(input, iv, signature); }
        catch (Exception error) {
            return new { ok = false, plaintextHex = Hex(input), signature, ivHex = Hex(iv), exceptionType = error.GetType().FullName };
        }
    }

    private static int Main()
    {
        try
        {
            byte[] iv = new byte[16];
            for (int index = 0; index < iv.Length; index++) iv[index] = (byte)(0x70 + index);
            List<object> fixtures = new List<object>();
            foreach (int length in new int[] { 0, 1, 15, 16, 17, 31, 32, 33, 64 })
            {
                byte[] input = new byte[length];
                for (int index = 0; index < input.Length; index++) input[index] = (byte)index;
                fixtures.Add(Attempt(input, iv, false));
                fixtures.Add(Attempt(input, iv, true));
            }
            Console.WriteLine(new JavaScriptSerializer().Serialize(new {
                schemaVersion = 1,
                scope = "Local reimplementation of inspected CIL; no target assembly or APK executed",
                clrVersion = Environment.Version.ToString(), targetRuntimeMatchEstablished = false,
                fixtures
            }));
            return 0;
        }
        catch (Exception error) { Console.Error.WriteLine(error); return 1; }
    }
}
