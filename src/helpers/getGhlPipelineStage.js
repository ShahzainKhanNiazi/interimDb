const { ghlDefaultPipelineId } = require("../../constants/ghlPipelineMapping");
const { ghlStageMapping, ghlDefaultStageId, ghlDefaultStage } = require("../../constants/ghlStageMapping");



// Helper function to get the pipeline stage ID
const getPipelineStageId = async (pipelineId, stageName) => {
    const pipeline = ghlStageMapping[pipelineId] || ghlDefaultPipelineId;
    if (pipeline) {
      return pipeline.stages[stageName];
    }
    return ghlDefaultStageId;  // Fallback if pipeline not found
  }; 

  // Helper function to get the pipeline stage name based on stage ID
const getPipelineStageName = async (pipelineId, stageId) => {
  const pipeline = ghlStageMapping[pipelineId]; // Get the pipeline based on pipelineId
  if (pipeline) {
    // Iterate over the stages object to find the stageName corresponding to stageId
    for (const [stageName, stageIdValue] of Object.entries(pipeline.stages)) {
      if (stageIdValue === stageId) {
        return stageName; // Return the stageName if the stageId matches
      }
    }
  }
  return ghlDefaultStage;  // Fallback if pipeline or stage ID is not found
};


module.exports = { getPipelineStageId, getPipelineStageName };

