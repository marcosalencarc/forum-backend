import {
  UploadParams,
  Uploader,
} from '@/domain/forum/application/storage/uploader'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { EnvService } from '../env/env.service'
import { randomUUID } from 'node:crypto'

@Injectable()
export class R2Storage implements Uploader {
  private client: S3Client

  constructor(private envService: EnvService) {
    const accountId = envService.get('CLOUDFLARE_ACCOUNT_ID')
    console.log(accountId)
    this.client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
      apiVersion: 'v2',
    })
  }

  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ url: string }> {
    const uploadId = randomUUID()
    const uniqueFileName = `${uploadId}-${fileName}`
    console.log(this.envService.get('AWS_BUCKET_NAME'))
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.envService.get('AWS_BUCKET_NAME'),
          Key: uniqueFileName,
          ContentType: fileType,
          Body: body,
        }),
      )
    } catch (error) {
      console.log(error)
    }

    return {
      url: uniqueFileName,
    }
  }
}
