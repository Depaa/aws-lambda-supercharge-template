import * as cdk from 'aws-cdk-lib';
import { CfnResource } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import {
  Architecture,
  Runtime,
  RuntimeFamily,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join, posix, resolve } from 'path';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaAppDir = resolve(__dirname, '../../../');
    const serviceAPost = new NodejsFunction(this, 'ServiceA-post', {
      description: 'Lambda for service A - post api - TS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDir,
      entry: join(lambdaAppDir, 'src/service-a/post/handler.ts'),
      depsLockFilePath: join(lambdaAppDir, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: [],
        platform: 'node',
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        nodeModules: [
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'ServiceA-post',
        POWERTOOLS_METRICS_NAMESPACE: 'ServiceA',
        POWERTOOLS_LOG_LEVEL: 'DEBUG',
      },
    });

    const serviceBPost = new NodejsFunction(this, 'ServiceB-post', {
      description: 'Lambda for service B - post api - JS',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDir,
      entry: join(lambdaAppDir, 'src/service-b/post/handler.js'),
      depsLockFilePath: join(lambdaAppDir, 'package-lock.json'),
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
        externalModules: [],
        platform: 'node',
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        nodeModules: [
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/tracer',
        ],
      },
      environment: {
        POWERTOOLS_SERVICE_NAME: 'ServiceB-post',
        POWERTOOLS_METRICS_NAMESPACE: 'ServiceB',
        POWERTOOLS_LOG_LEVEL: 'DEBUG',
      },
    });

    /**
     * Building LLRT Lambda from 'tmokmss' repo 'cdk-lambda-llrt'
     */
    const binaryUrl =
      'https://github.com/awslabs/llrt/releases/latest/download/llrt-lambda-arm64.zip';
    const cacheDir = `.tmp/llrt/latest/arm64`;

    const serviceLLRTAPost = new NodejsFunction(this, 'ServiceLLRTA-post', {
      description: 'Lambda for service LLRT A - post api - LLRT',
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler',
      // * set this to remove a warning about runtime. we use al2023 runtime anyway.
      runtime: new Runtime('nodejs20.x', RuntimeFamily.NODEJS),
      architecture: Architecture.ARM_64,
      projectRoot: lambdaAppDir,
      entry: join(lambdaAppDir, 'src/service-llrt-a/post/handler.js'),
      depsLockFilePath: join(lambdaAppDir, 'package-lock.json'),
      bundling: {
        target: 'es2020',
        format: OutputFormat.ESM,
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--tree-shaking': 'true',
        },
        nodeModules: [],
        // set this because local bundling will not work on Windows
        forceDockerBundling: process.platform == 'win32' ? true : undefined,
        commandHooks: {
          beforeBundling: () => [],
          afterBundling: (i, o) => [
            // Download llrt binary from GitHub release and cache it
            `if [ ! -e ${posix.join(i, cacheDir, 'bootstrap')} ]; then
              mkdir -p ${posix.join(i, cacheDir)}
              cd ${posix.join(i, cacheDir)}
              curl -L -o llrt_temp.zip ${binaryUrl}
              unzip llrt_temp.zip
              rm -rf llrt_temp.zip
             fi`,
            `cp ${posix.join(i, cacheDir, 'bootstrap')} ${o}`,
          ],
          beforeInstall: () => [],
        },
        // https://github.com/awslabs/llrt?tab=readme-ov-file#using-aws-sdk-v3-with-llrt
        externalModules: [
          '@aws-sdk/client-cloudwatch-events',
          '@aws-sdk/client-cloudwatch-logs',
          '@aws-sdk/client-cognito-identity',
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/client-eventbridge',
          '@aws-sdk/client-kms',
          '@aws-sdk/client-lambda',
          '@aws-sdk/client-s3',
          '@aws-sdk/client-secrets-manager',
          '@aws-sdk/client-ses',
          '@aws-sdk/client-sfn',
          '@aws-sdk/client-sns',
          '@aws-sdk/client-sqs',
          '@aws-sdk/client-ssm',
          '@aws-sdk/client-sts',
          '@aws-sdk/client-xray',
          '@aws-sdk/credential-providers',
          '@aws-sdk/lib-dynamodb',
          '@aws-sdk/s3-request-presigner',
          '@aws-sdk/util-dynamodb',
          '@smithy',
          'uuid',
        ],
      },
      environment: {},
      tracing: Tracing.ACTIVE,
    });
    // * set this to remove a warning about runtime. we use al2023 runtime anyway.
    (serviceLLRTAPost.node.defaultChild as CfnResource).addPropertyOverride(
      'Runtime',
      'provided.al2023',
    );

    const httpApi = new HttpApi(this, 'ServiceAPI', {
      apiName: 'ServiceAPI',
      corsPreflight: {
        allowMethods: [CorsHttpMethod.POST],
        allowOrigins: ['*'],
      },
    });

    const templateLambdaIntegration = new HttpLambdaIntegration(
      'ServiceAPIIntegration',
      serviceAPost,
    );
    httpApi.addRoutes({
      path: '/service-a',
      methods: [HttpMethod.POST],
      integration: templateLambdaIntegration,
    });

    const templateLambdaBIntegration = new HttpLambdaIntegration(
      'ServiceAPIBIntegration',
      serviceBPost,
    );
    httpApi.addRoutes({
      path: '/service-b',
      methods: [HttpMethod.POST],
      integration: templateLambdaBIntegration,
    });

    const templateLambdaLLRTAIntegration = new HttpLambdaIntegration(
      'ServiceAPILLRTAIntegration',
      serviceLLRTAPost,
    );
    httpApi.addRoutes({
      path: '/service-llrt-a',
      methods: [HttpMethod.POST],
      integration: templateLambdaLLRTAIntegration,
    });
  }
}
