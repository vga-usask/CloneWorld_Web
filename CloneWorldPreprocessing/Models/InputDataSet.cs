using Newtonsoft.Json;
using System.Collections.Generic;

namespace CloneWorldPreprocessing.Models.InputDataSet
{
    public class Root
    {
        [JsonProperty(PropertyName = "systemName")]
        public string SystemName { get; set; }
        [JsonProperty(PropertyName = "revision")]
        public int FinalRevision { get; set; }
        [JsonProperty(PropertyName = "types")]
        public List<CloneType> Types { get; set; }
    }

    public class CloneType
    {
        [JsonProperty(PropertyName = "id")]
        public int Id { get; set; }
        [JsonProperty(PropertyName = "classes")]
        public List<CloneClass> Classes { get; set; }
    }

    public class CloneClass
    {
        [JsonProperty(PropertyName = "id")]
        public int Id { get; set; }
        [JsonProperty(PropertyName = "cloneCount")]
        public int CloneCount { get; set; }
        [JsonProperty(PropertyName = "clones")]
        public List<CloneInstance> Clones { get; set; }
    }

    public class CloneInstance
    {
        [JsonProperty(PropertyName = "id")]
        public int Id { get; set; }
        [JsonProperty(PropertyName = "chainId")]
        public int ChainId { get; set; }
        [JsonProperty(PropertyName = "filePath")]
        public string FilePath { get; set; }
        [JsonProperty(PropertyName = "startLine")]
        public int StartLine { get; set; }
        [JsonProperty(PropertyName = "endLine")]
        public int EndLine { get; set; }
        [JsonProperty(PropertyName = "sumChangeCount")]
        public int SumChangeCount { get; set; }
        [JsonProperty(PropertyName = "finalRevision")]
        public int FinalRevision { get; set; }
    }
}
