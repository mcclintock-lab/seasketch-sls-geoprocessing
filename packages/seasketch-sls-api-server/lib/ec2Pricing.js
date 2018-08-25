const debug = require("./debug");
const knex = require('./knex');
const AWS = require("aws-sdk");
const ec2 = new AWS.EC2({ region: "us-west-2" });
const pricing = new AWS.Pricing({ region: "us-east-1" });

// Assumes launch templates are in us-west-2 and that they are running Linux.
// Warning: Windows, other software, other regions are unsupported currently.
// Returns a promise that resolves with [price per hour, instanceType]
const getLaunchTemplatePricing = async launchTemplateId => {
  const data = await ec2
    .describeLaunchTemplateVersions({ LaunchTemplateId: launchTemplateId })
    .promise();
  if (!data.LaunchTemplateVersions.length) {
    throw new Error(`Could not find launch template ${launchTemplateId}`);
  }
  const lt = data.LaunchTemplateVersions.find(l => l.DefaultVersion);
  const instanceType = lt.LaunchTemplateData.InstanceType;
  const priceData = await pricing
    .getProducts({
      Filters: [
        {
          Field: "instanceType",
          Type: "TERM_MATCH",
          Value: "m5.2xlarge"
        },
        {
          Field: "operatingSystem",
          Type: "TERM_MATCH",
          Value: "Linux"
        },
        {
          Field: "preInstalledSw",
          Type: "TERM_MATCH",
          Value: "NA"
        },
        {
          Field: "location",
          Type: "TERM_MATCH",
          Value: "US West (Oregon)"
        },
        {
          Field: "tenancy",
          Type: "TERM_MATCH",
          Value: "shared"
        }
      ],
      ServiceCode: "AmazonEC2",
      FormatVersion: "aws_v1",
      MaxResults: 10
    })
    .promise();
  if (priceData.PriceList.length === 0) {
    throw new Error(`Could not find price list for ${instanceType}`);
  } else {
    const OnDemandTerms = priceData.PriceList[0].terms.OnDemand;
    return [OnDemandTerms[Object.keys(OnDemandTerms)[0]].priceDimensions[
      Object.keys(
        OnDemandTerms[Object.keys(OnDemandTerms)[0]].priceDimensions
      )[0]
    ].pricePerUnit.USD, instanceType];
  }
};

// Updates price-per-hour for a function in the database
const updatePricePerHour = async (projectName, name) => {
  const record = await knex("functions")
    .select("launch_template")
    .where({ projectName, name })
    .first();
  if (record && record.launchTemplate) {
    try {
      const [price, instanceType] = await getLaunchTemplatePricing(record.launchTemplate);
      debug(`Updating price-per-hour for ${projectName}-geoprocessing-${name} to ${price}`);
      return knex("functions")
        .where({ projectName, name })
        .update({ pricePerHour: price, instanceType });
    } catch (e) {
      // do nothing. Temporary service outage or possibly a deleted launchTemplate
      debug(`Could not update pricing for ${record.launchTemplate}`);
      return;
    }
  } else {
    // Not really an error condition. Possible function was just changed.
    debug(
      `Could not update pricing for ${projectName}-geoprocessing-${name}`
    );
    return;
  }
};

const updatePrices = async () => {
  const functions = await knex("functions")
    .select("projectName", "name")
    .whereNotNull("instance_type");
  functions.forEach((f) => updatePricePerHour(f.projectName, f.name))
}


module.exports = {
  getLaunchTemplatePricing,
  updatePricePerHour,
  updatePrices,
  initPriceMonitor: () => {
    updatePrices();
    setInterval(updatePrices, 1000 * 60 * 30); // run every 30 minutes
  }
};
