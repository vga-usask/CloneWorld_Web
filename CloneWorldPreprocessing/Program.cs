using Newtonsoft.Json;
using System.Linq;
using System.IO;
using System;
using System.Collections.Generic;
using CloneWorldPreprocessing.Models.OutputDataSet;
using CloneWorldPreprocessing.Utilities;
using System.Drawing;

namespace CloneWorldPreprocessing
{
    class Program
    {
        const int TilesMaxLayer = 5;
        const int TileSize = 256;

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("Please add the parameter: <R script executable path>");
                return;
            }

            Console.WriteLine("Starting...");
            var currentPath = Directory.GetCurrentDirectory();
            Console.WriteLine("Current path is " + currentPath);
            var rScriptExecutablePath = args[0];
            Console.WriteLine("R script executable path is " + rScriptExecutablePath);
            var rScriptCodePath = Path.Combine(currentPath, "script.R");
            Console.WriteLine("R script code path is " + rScriptCodePath);
            var inputPath = Path.Combine(currentPath, "in");
            Console.WriteLine("Data file path is " + inputPath);

            var dataSet = FillDataSet(inputPath);

            var cloneList = FillCloneList(dataSet);
            var classList = FillClassList(dataSet);
            var fileList = FillFileList(cloneList);
            var systemInfo = FillSystemInfo(dataSet);

            GenerateCoordinatesForClones(cloneList, classList, fileList);
            CloneColorFiller.FillDirectoryColorsForClones(cloneList);
            CloneColorFiller.FillClassColorsForClones(cloneList, classList);

            ResetTheDirectory(currentPath);
            GenerateJsonFiles(currentPath, cloneList, classList, fileList, systemInfo);
            GeneratePlotByRunningRScript(currentPath, rScriptExecutablePath, rScriptCodePath);

            SplitImagesToTiles(currentPath, TilesMaxLayer, TileSize);

            CopyFilesToOutputDirectory(currentPath, inputPath);

            Console.WriteLine("All done.");
            Console.ReadKey();
        }

        private static void SplitImagesToTiles(string currentPath, int MaxLayer, int TileSize)
        {
            Console.WriteLine("Generating tiled images...");

            Directory.CreateDirectory(Path.Combine(currentPath, "temp/img/tiled"));

            Directory.CreateDirectory(Path.Combine(currentPath, "temp/img/tiled/plain"));
            SplitImagesToTilesForAllLayers(currentPath, "plain", MaxLayer, TileSize);

            Directory.CreateDirectory(Path.Combine(currentPath, "temp/img/tiled/contour"));
            SplitImagesToTilesForAllLayers(currentPath, "contour", MaxLayer, TileSize);
        }

        private static void SplitImagesToTilesForAllLayers(string currentPath, string type, int maxLayer, int tileSize)
        {
            for (int layer = 1; layer <= maxLayer; layer++)
            {
                SplitImageToTilesForSingleLayer(currentPath, type, layer, tileSize);
            }
        }

        private static void SplitImageToTilesForSingleLayer(string currentPath, string type, int layer, int tileSize)
        {
            var image = new Bitmap(Path.Combine(currentPath, "temp/img/full", type, layer + ".png"));
            for (int row = 0; row < Math.Pow(2, layer); row++)
            {
                for (int col = 0; col < Math.Pow(2, layer); col++)
                {
                    var rect = new Rectangle(col * tileSize, row * tileSize, tileSize, tileSize);
                    var format = image.PixelFormat;
                    var clonedImage = image.Clone(rect, format);
                    Console.WriteLine(Path.Combine(currentPath, "temp/img/tiled", type, layer + "_" + row + "_" + col + ".png"));
                    clonedImage.Save(Path.Combine(currentPath, "temp/img/tiled", type, layer + "_" + row + "_" + col + ".png"));
                }
            }
        }

        private static void CopyFilesToOutputDirectory(string currentPath, string inputPath)
        {
            Console.WriteLine("Copying files to ouput directory...");
            var outputPath = Path.Combine(currentPath, "out");
            if (Directory.Exists(outputPath))
            {
                Directory.Delete(outputPath, true);
            }

            DirectoryCopy(Path.Combine(inputPath, "vis_system"), Path.Combine(outputPath), true);
            Directory.CreateDirectory(Path.Combine(outputPath, "data_files"));
            File.Copy(Path.Combine(inputPath, "data_jsons", "support_count_map.json"), Path.Combine(outputPath, "data_files", "support_count_map.json"));
            DirectoryCopy(Path.Combine(inputPath, "source_code"), Path.Combine(outputPath, "data_files", "src"), true);
            DirectoryCopy(Path.Combine(currentPath, "temp", "JSONs"), Path.Combine(outputPath, "data_files"), true);
            DirectoryCopy(Path.Combine(currentPath, "temp", "img", "tiled"), Path.Combine(outputPath, "tiles"), true);
        }

        private static void GeneratePlotByRunningRScript(string currentPath, string rScriptExecutablePath, string rScriptCodePath)
        {
            Console.WriteLine("Generating plot images by running R script...");
            var result = RScriptRunner.RunFromCmd(
                            rScriptCodePath,
                            rScriptExecutablePath,
                            ""
                        );
        }

        private static void GenerateJsonFiles(string currentPath, List<CloneInstance> cloneList, List<CloneClass> classList, List<CloneFile> fileList, SystemInfo systemInfo)
        {
            Console.WriteLine("Generating JSON files...");
            File.WriteAllText(Path.Combine(currentPath, "temp/JSONs/classes.json"), JsonConvert.SerializeObject(classList));
            File.WriteAllText(Path.Combine(currentPath, "temp/JSONs/files.json"), JsonConvert.SerializeObject(fileList));
            File.WriteAllText(Path.Combine(currentPath, "temp/JSONs/clones.json"), JsonConvert.SerializeObject(cloneList));
            File.WriteAllText(Path.Combine(currentPath, "temp/JSONs/system.json"), JsonConvert.SerializeObject(systemInfo));
        }

        private static void ResetTheDirectory(string currentPath)
        {
            Console.WriteLine("Reseting output directory...");
            if (Directory.Exists(Path.Combine(currentPath, "temp")))
            {
                Directory.Delete(Path.Combine(currentPath, "temp"), true);
            }
            Directory.CreateDirectory(Path.Combine(currentPath, "temp/JSONs"));
        }

        private static void GenerateCoordinatesForClones(List<CloneInstance> cloneList, List<CloneClass> classList, List<CloneFile> fileList)
        {
            Console.WriteLine("generating ploting coordinates for clones...");
            foreach (var clone in cloneList)
            {
                var classIndex = classList.FindIndex(clazz => clazz.Type.ToString() == clone.ClassType && clazz.Id.ToString() == clone.ClassId);
                var fileIndex = fileList.FindIndex(file => file.Path == clone.FilePath);
                clone.X = (fileIndex / (float)fileList.Count).ToString();
                clone.Y = (classIndex / (float)classList.Count).ToString();
            }
        }

        private static Models.InputDataSet.Root FillDataSet(string inputPath)
        {
            Console.WriteLine("Reading dataset from file...");
            var mainDataFilePath = Path.Combine(inputPath, "data_jsons", "main.json");
            return JsonConvert.DeserializeObject<Models.InputDataSet.Root>(File.ReadAllText(mainDataFilePath));
        }

        private static List<CloneFile> FillFileList(List<CloneInstance> cloneList)
        {
            Console.WriteLine("Filling the file list...");
            return (from clone in cloneList
                    group clone by clone.FilePath into file
                    orderby file.Count() descending
                    select new CloneFile
                    {
                        Path = file.Key,
                        CloneCount = file.Count()
                    }).ToList();
        }

        private static List<CloneClass> FillClassList(Models.InputDataSet.Root dataSet)
        {
            Console.WriteLine("Filling the class list...");
            return (from type in dataSet.Types
                    from clazz in type.Classes
                    orderby clazz.CloneCount descending
                    select new CloneClass
                    {
                        Type = type.Id,
                        Id = clazz.Id,
                        CloneCount = clazz.CloneCount
                    }).ToList();
        }

        private static List<CloneInstance> FillCloneList(Models.InputDataSet.Root dataSet)
        {
            Console.WriteLine("Filling the clone list...");
            return (from type in dataSet.Types
                    from clazz in type.Classes
                    from clone in clazz.Clones
                    select new CloneInstance
                    {
                        Id = clone.Id.ToString(),
                        ChainId = clone.ChainId.ToString(),
                        ClassType = type.Id.ToString(),
                        ClassId = clazz.Id.ToString(),
                        FilePath = clone.FilePath,
                        StartLine = clone.StartLine.ToString(),
                        EndLine = clone.EndLine.ToString(),
                        SumChangeCount = clone.SumChangeCount.ToString(),
                        FinalRevision = clone.FinalRevision.ToString()
                    }).ToList();
        }

        private static SystemInfo FillSystemInfo(Models.InputDataSet.Root dataSet)
        {
            Console.WriteLine("Filling the system info...");
            return new SystemInfo
            {
                Name = dataSet.SystemName,
                FinalRevision = dataSet.FinalRevision
            };
        }

        private static void DirectoryCopy(string sourceDirName, string destDirName, bool copySubDirs)
        {
            // Get the subdirectories for the specified directory.
            DirectoryInfo dir = new DirectoryInfo(sourceDirName);

            if (!dir.Exists)
            {
                throw new DirectoryNotFoundException(
                    "Source directory does not exist or could not be found: "
                    + sourceDirName);
            }

            DirectoryInfo[] dirs = dir.GetDirectories();
            // If the destination directory doesn't exist, create it.
            if (!Directory.Exists(destDirName))
            {
                Directory.CreateDirectory(destDirName);
            }

            // Get the files in the directory and copy them to the new location.
            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string temppath = Path.Combine(destDirName, file.Name);
                file.CopyTo(temppath, false);
            }

            // If copying subdirectories, copy them and their contents to new location.
            if (copySubDirs)
            {
                foreach (DirectoryInfo subdir in dirs)
                {
                    string temppath = Path.Combine(destDirName, subdir.Name);
                    DirectoryCopy(subdir.FullName, temppath, copySubDirs);
                }
            }
        }

    }
}
