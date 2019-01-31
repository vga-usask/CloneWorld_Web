﻿using System;
using System.Diagnostics;
using System.IO;

namespace CloneWorldPreprocessing.Utilities
{
    /// <summary>
    /// This class runs R code from a file using the console.
    /// </summary>
    public static class RScriptRunner
    {
        /// <summary>
        /// Runs an R script from a file using Rscript.exe.
        /// Example:  
        ///   RScriptRunner.RunFromCmd(curDirectory + @"\ImageClustering.r", "rscript.exe", curDirectory.Replace('\\','/'));
        /// Getting args passed from C# using R:
        ///   args = commandArgs(trailingOnly = TRUE)
        ///   print(args[1]);
        /// </summary>
        /// <param name="rCodeFilePath">File where your R code is located.</param>
        /// <param name="rScriptExecutablePath">Usually only requires "rscript.exe"</param>
        /// <param name="args">Multiple R args can be seperated by spaces.</param>
        /// <returns>Returns a string with the R responses.</returns>
        public static string RunFromCmd(string rCodeFilePath, string rScriptExecutablePath, string args)
        {
            string file = rCodeFilePath;
            string result = string.Empty;

            try
            {

                var info = new ProcessStartInfo();
                info.FileName = rScriptExecutablePath;
                //info.WorkingDirectory = Path.GetDirectoryName(rScriptExecutablePath);
                info.WorkingDirectory = Directory.GetCurrentDirectory();
                info.Arguments = rCodeFilePath + " " + args;

                info.RedirectStandardInput = false;
                info.RedirectStandardOutput = true;
                info.UseShellExecute = false;
                info.CreateNoWindow = true;

                using (var proc = new Process())
                {
                    proc.StartInfo = info;
                    proc.Start();
                    result = proc.StandardOutput.ReadToEnd();

                    proc.CloseMainWindow();
                    proc.Close();
                }

                return result;
            }
            catch (Exception ex)
            {
                throw new Exception("R Script failed: " + result, ex);
            }
        }
    }
}