using Newtonsoft.Json;

namespace CloneWorldPreprocessing.Models.OutputDataSet
{
    public class CloneClass
    {
        [JsonProperty(PropertyName = "type")]
        public int Type { get; set; }
        [JsonProperty(PropertyName = "id")]
        public int Id { get; set; }
        [JsonProperty(PropertyName = "cloneCount")]
        public int CloneCount { get; set; }
    }

    public class CloneFile
    {
        [JsonProperty(PropertyName = "path")]
        public string Path { get; set; }
        [JsonProperty(PropertyName = "cloneCount")]
        public int CloneCount { get; set; }
    }

    public class CloneInstance
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }
        [JsonProperty(PropertyName = "chainId")]
        public string ChainId { get; set; }
        [JsonProperty(PropertyName = "classType")]
        public string ClassType { get; set; }
        [JsonProperty(PropertyName = "classId")]
        public string ClassId { get; set; }
        [JsonProperty(PropertyName = "filePath")]
        public string FilePath { get; set; }
        [JsonProperty(PropertyName = "startLine")]
        public string StartLine { get; set; }
        [JsonProperty(PropertyName = "endLine")]
        public string EndLine { get; set; }
        [JsonProperty(PropertyName = "sumChangeCount")]
        public string SumChangeCount { get; set; }
        [JsonProperty(PropertyName = "finalRevision")]
        public string FinalRevision { get; set; }
        [JsonProperty(PropertyName = "x")]
        public string X { get; set; }
        [JsonProperty(PropertyName = "y")]
        public string Y { get; set; }
        [JsonProperty(PropertyName = "DC")]
        public string DirectoryColor { get; set; }
        [JsonProperty(PropertyName = "CC")]
        public string ClassColor { get; set; }
    }

    public class SystemInfo
    {
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }
        [JsonProperty(PropertyName = "finalRevision")]
        public int FinalRevision { get; set; }
    }
}
