import React from "react";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import { withStyles } from "@material-ui/core/styles";
import { HumanizedDuration } from "@seasketch-sls-geoprocessing/client";
import { lambdaCost, ec2Cost } from "../calculateCost";

const styles = theme => ({
  dt: {
    paddingLeft: 0,
    paddingRight: 0
  },
  dd: {
    paddingRight: "4px !important",
    color: theme.palette.text.secondary
  }
});

const FunctionDetails = ({
  launchTemplate,
  instanceType,
  pricePerHour,
  memorySize,
  averageMemoryUse,
  timeout,
  workerTimeout,
  billedDuration50thPercentile,
  duration50thPercentile,
  invocations,
  classes
}) => {
  let totalAverageCost = lambdaCost(memorySize, billedDuration50thPercentile);
  if (launchTemplate) {
    totalAverageCost += ec2Cost(pricePerHour, duration50thPercentile);
  }
  return (
    <React.Fragment>
      <TableRow>
        <TableCell scope="row" className={classes.dt}>
          Function Type
        </TableCell>
        <TableCell numeric className={classes.dd}>
          {launchTemplate ? "ec2" : "lambda"}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell scope="row" className={classes.dt}>
          Cost
        </TableCell>
        <TableCell numeric className={classes.dd}>
          {totalAverageCost < 0.1
            ? `$1.00 pays for ${Math.round(1 / totalAverageCost)} runs`
            : `\$${Math.round(totalAverageCost * 100) / 100}`}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell scope="row" className={classes.dt}>
          Invocations
        </TableCell>
        <TableCell numeric className={classes.dd}>
          {invocations}
        </TableCell>
      </TableRow>
      {launchTemplate ? (
        <React.Fragment>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Launch Template
            </TableCell>
            <TableCell numeric className={classes.dd}>
              {launchTemplate}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Instance Type
            </TableCell>
            <TableCell numeric className={classes.dd}>
              {instanceType}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Worker Timeout
            </TableCell>
            <TableCell numeric className={classes.dd}>
              <HumanizedDuration duration={workerTimeout * 1000 * 60} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Usual Duration
            </TableCell>
            <TableCell numeric className={classes.dd}>
              <HumanizedDuration duration={duration50thPercentile} />
            </TableCell>
          </TableRow>
        </React.Fragment>
      ) : null}
      {!launchTemplate && (
        <React.Fragment>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Memory Size
            </TableCell>
            <TableCell numeric className={classes.dd}>
              {memorySize} MB
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Average Memory Use
            </TableCell>
            <TableCell numeric className={classes.dd}>
              {averageMemoryUse} MB
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Timeout
            </TableCell>
            <TableCell numeric className={classes.dd}>
              <HumanizedDuration duration={timeout * 1000} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row" className={classes.dt}>
              Billed Duration
            </TableCell>
            <TableCell numeric className={classes.dd}>
              <HumanizedDuration duration={billedDuration50thPercentile} />
            </TableCell>
          </TableRow>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default withStyles(styles)(FunctionDetails);
