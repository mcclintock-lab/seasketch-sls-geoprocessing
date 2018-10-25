import React from "react";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import { withStyles } from "@material-ui/core/styles";
import { HumanizedDuration } from "@seasketch-sls-geoprocessing/client";
import { lambdaCost, ec2Cost } from "../calculateCost";
import Input from '@material-ui/core/Input';

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
  classes,
  costLimitUsd,
  onCostLimitChange,
  invocationsThisMonth,
  budgetSpentPercent,
  costPerInvocation
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
              Memory Use
            </TableCell>
            <TableCell numeric className={classes.dd}>
              {averageMemoryUse} MB / {memorySize} MB
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
              Average Billed Duration
            </TableCell>
            <TableCell numeric className={classes.dd}>
              <HumanizedDuration duration={billedDuration50thPercentile} />
            </TableCell>
          </TableRow>
        </React.Fragment>
      )}
      <TableRow>
        <TableCell scope="row" className={classes.dt}>
          Invocations this month
        </TableCell>
        <TableCell numeric className={classes.dd}>
          {invocationsThisMonth}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell scope="row" className={classes.dt}>
          Monthly Cost Limit
        </TableCell>
        <TableCell numeric className={classes.dd}>
          $ <Input style={{width: 50 }} inputProps={{style: {textAlign: 'right'}}} type="number" step={1} value={costLimitUsd} onChange={(e, v) => onCostLimitChange(e, v)} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell scope="row" colSpan={2} style={{textAlign: 'center'}}>
          ${costLimitUsd}.00 pays for {new Intl.NumberFormat('en-us', { maximumSignificantDigits: 3 }).format(Math.round(costLimitUsd / costPerInvocation))} runs. <br /> {budgetSpentPercent}% of monthly budget used.
        </TableCell>
      </TableRow>

    </React.Fragment>
  );
};

export default withStyles(styles)(FunctionDetails);
