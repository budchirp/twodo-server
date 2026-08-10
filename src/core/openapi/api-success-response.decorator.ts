import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { ApiSuccessEnvelopeDto } from '@/core/openapi/api-response.dto'
import { applyDecorators } from '@nestjs/common'
import type { Type } from '@nestjs/common'

type ApiSuccessResponseOptions = {
  description?: string
  isArray?: boolean
  nullable?: boolean
  status?: number
  type?: Type<unknown>
}

function createDataSchema(options: ApiSuccessResponseOptions) {
  if (!options.type) {
    return { nullable: true, example: null }
  }

  if (options.isArray) {
    return {
      type: 'array',
      items: { $ref: getSchemaPath(options.type) },
      ...(options.nullable ? { nullable: true } : {})
    }
  }

  if (options.nullable) {
    return {
      allOf: [{ $ref: getSchemaPath(options.type) }],
      nullable: true
    }
  }

  return { $ref: getSchemaPath(options.type) }
}

export function ApiSuccessResponse(options: ApiSuccessResponseOptions = {}) {
  const models = options.type ? [ApiSuccessEnvelopeDto, options.type] : [ApiSuccessEnvelopeDto]

  return applyDecorators(
    ApiExtraModels(...models),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
          {
            properties: {
              data: createDataSchema(options)
            }
          }
        ]
      }
    })
  )
}
