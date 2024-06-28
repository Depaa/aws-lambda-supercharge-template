import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpResponseSerializer from '@middy/http-response-serializer';
import httpSecurityHeaders from '@middy/http-security-headers';
import inputOutputLogger from '@middy/input-output-logger';
import { main } from './index';

const logger = new Logger();
const metrics = new Metrics();
const tracer = new Tracer();

export const handler = middy(main)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(injectLambdaContext(logger, { clearState: true, logEvent: true }))
  .use(
    inputOutputLogger({
      logger: (request) => {
        logger.debug(
          JSON.stringify(request.event) ?? JSON.stringify(request.response),
        );
      },
    }),
  )
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpSecurityHeaders())
  .use(httpErrorHandler({}))
  .use(
    httpResponseSerializer({
      serializers: [
        {
          regex: /^application\/json$/,
          serializer: ({ body }) => JSON.stringify(body),
        },
        {
          regex: /^text\/(html|plain)$/,
          serializer: ({ body }) => body,
        },
      ],
      defaultContentType: 'application/json',
    }),
  );
