namespace Orders.Infrastructure.Config;

/// <summary>
/// Carga un archivo .env (solo para desarrollo local). Las variables que ya existen
/// en el entorno ganan, así en el servidor manda el EnvironmentFile de systemd.
/// </summary>
public static class DotEnv
{
    public static void Load(string path = ".env")
    {
        if (!File.Exists(path)) return;

        foreach (var raw in File.ReadAllLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;

            var separator = line.IndexOf('=');
            if (separator <= 0) continue;

            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"');

            if (Environment.GetEnvironmentVariable(key) is null)
                Environment.SetEnvironmentVariable(key, value);
        }
    }
}
