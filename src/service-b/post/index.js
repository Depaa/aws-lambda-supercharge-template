import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
// import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger();
const metrics = new Metrics();
// const tracer = new Tracer();

export async function main(event) {
  logger.debug('event', { ...event });

  metrics.addMetric('SuccessfulInvocations', MetricUnit.Count, 1);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
}
