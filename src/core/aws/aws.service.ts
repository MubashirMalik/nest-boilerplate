import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class AwsService {
    private s3: S3;
    private bucketName: string;

    constructor(private configService: ConfigService) {
        this.s3 = new S3({
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            },
            region: this.configService.get('AWS_S3_REGION'),
        });

        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    }

    async uploadFile(file: Express.Multer.File, folderName: string): Promise<string> {
        try {
            const upload = new Upload({
                client: this.s3,
                params: {
                    Bucket: this.bucketName,
                    Key: `${folderName}/${Date.now()}`, // Added uploads/ folder prefix
                    Body: file.buffer,
                    ContentType: file.mimetype
                },
            });

            const result = await upload.done();
            return result.Location;
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException('Failed to upload file to AWS');
        }
    }

    async getFile(key: string) {
        const res = await fetch(key);

        if (!res.ok) {
            throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
        }

        return await res.text(); // CSV as raw string
    }

    async deleteFile(key: string): Promise<void> {
        try {
            // Extract key from S3 URL if full URL is provided
            const s3Key = key.includes('amazonaws.com') 
                ? key.split('.com/')[1]
                : key;

            const params = {
                Bucket: this.bucketName,
                Key: s3Key,
            };
            
            await this.s3.deleteObject(params);
        } catch (error) {
            console.error('Failed to delete file from S3:', error);
            throw new InternalServerErrorException('Failed to delete file from AWS');
        }
    }
}