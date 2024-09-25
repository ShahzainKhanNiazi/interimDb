const { ghlDefaultPipelineId } = require("../../constants/ghlPipelineMapping");
const { ghlStageMapping, ghlDefaultStageId } = require("../../constants/ghlStageMapping");


// Helper function to get the pipeline stage ID
const getPipelineStageId = (pipelineId, stageName) => {
    const pipeline = ghlStageMapping[pipelineId] || ghlDefaultPipelineId;
    if (pipeline) {
      return pipeline.stages[stageName];
    }
    return ghlDefaultStageId;  // Fallback if pipeline not found
  }; 


module.exports = { getPipelineStageId };
