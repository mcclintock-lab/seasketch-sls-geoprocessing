const COST_PER_GB_SECOND = 0.00001667;
const APPROX_SQS_COST = 0.00000040 * (// per message
                        1 + // results message
                        3 // log messages
);
const COST_PER_REQUEST = 0.0000002;

const lambdaCost = (memorySize, billedDuration) => COST_PER_GB_SECOND * 
  (memorySize / 1000) * 
  (billedDuration / 1000) + 
  COST_PER_REQUEST + 
  APPROX_SQS_COST

const ec2Cost = (pricePerHour, duration) => {
  // Even with per-second billing, ec2 sets a min of 60 seconds
  if (duration < 60000) {
    duration = 60000;
  }
  let minutes = duration / 1000 / 60;
  return (pricePerHour / 60 ) * minutes;
}

calculateCost = (func) => {
  if (func.launchTemplate) {
    return ec2Cost(func.pricePerHour, func.duration50thPercentile);
  } else {
    return lambdaCost(func.memorySize, func.billedDuration50thPercentile);
  }
}

module.exports = {lambdaCost, ec2Cost, calculateCost};