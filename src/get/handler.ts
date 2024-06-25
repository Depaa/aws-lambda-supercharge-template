import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import { main } from './index';

const logger = new Logger({ serviceName: 'serverlessAirline' });

const metrics = new Metrics({
  namespace: 'serverlessAirline',
  serviceName: 'orders',
});

const tracer = new Tracer({
  serviceName: 'serverlessAirline',
});

export const handler = middy(main)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(injectLambdaContext(logger, { clearState: true, logEvent: true }));
