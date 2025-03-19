import { Injectable, HttpStatus } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ApiResponse } from '../utility/response';
import { File } from './file.schema';
import { AllFileExtensions, ExtendedFileType } from './file.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

dotenv.config();

@Injectable()
export class FileService {
  private readonly s3: S3Client;
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_ID,
        secretAccessKey: process.env.AWS_PRIVATE_KEY,
      },
    });
  }
  validateFile(file: Express.Multer.File, type?: string, size: number = 100) {
    try {
      if (!type) type = file.mimetype.split('/')[0];
      let fileExtension = file.mimetype.split('/')[1];
      if (!AllFileExtensions[type]?.includes(fileExtension)) {
        if (type === 'image' || type === 'video')
          throw new Error(`File type is not supported`);
        fileExtension = file.originalname.split('.')[1];
        type = 'document';
      }
      const fileSize = file.size / 1024 / 1024; // size in MB
      if (fileSize > size) throw new Error('Maximum file size is 100mb');
      return ApiResponse.success('File', HttpStatus.OK, {
        ...file,
        type: type !== 'image' ? 'raw' : type,
        format: fileExtension,
      });
    } catch (error) {
      return ApiResponse.fail(error.message, HttpStatus.BAD_REQUEST, null);
    }
  }

  async uploadFile(
    file: ExtendedFileType,
    existingKey: string = null,
    Bucket: string = process.env.AWS_BUCKET_NAME,
  ) {
    if (existingKey) {
      this.deleteFile(Bucket, existingKey);
    }
    const Key = `${uuid()}_${new Date().toISOString()}_${file.originalname}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        ContentDisposition: 'inline',
      }),
    );
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
    return { url, Key, Bucket: process.env.AWS_BUCKET_NAME };
  }

  async createFiles(
    files: ExtendedFileType[],
    type?: string,
    controller: boolean = false,
    logosBackGround?: boolean,
  ) {
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const validationResult = this.validateFile(file, type);
        if (!validationResult.status) return validationResult;
        file.type = validationResult.data.type;
        file.format = validationResult.data.format;
      }
      for (const file of files) {
        const { Key, url, Bucket } = await this.uploadFile(file);
        const { format, mimetype, originalname, type } = file;
        const createdFile = await this.fileModel.create({
          url,
          mimetype,
          Key,
          format,
          originalname,
          Bucket,
          saved: !controller,
          type,
          logosBackGround: logosBackGround === true ? true : undefined,
          size: (file.size / 1024 / 1024).toFixed(3) + 'mb',
        });

        uploadedFiles.push(createdFile._id);
      }
      return ApiResponse.success(
        'Files Uploaded',
        HttpStatus.OK,
        uploadedFiles,
      );
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }
  async editFile(fileId: any, file: Express.Multer.File, type?: string) {
    try {
      const uploadedFile = await this.fileModel.findById(fileId);
      if (!uploadedFile)
        return ApiResponse.fail(
          'File does not exist',
          HttpStatus.NOT_FOUND,
          null,
        );
      const validationResult = this.validateFile(file, type);
      if (!validationResult.status) return validationResult;
      const { url, Bucket, Key } = await this.uploadFile(
        file,
        uploadedFile.Key,
      );
      const { mimetype, originalname, size } = file;
      const updatedFile = await this.fileModel.findByIdAndUpdate(
        uploadedFile._id,
        {
          url,
          Bucket,
          Key,
          mimetype,
          originalname,
          size: (size / 1024 / 1024).toFixed(3) + 'mb',
          type: validationResult.data.type,
          format: validationResult.data.format,
        },
        { new: true },
      );
      return ApiResponse.success('File Edited', HttpStatus.OK, updatedFile._id);
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }

  async deleteFile(Bucket: string, Key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket, Key }));
  }

  async deleteFiles(fileIds: Types.ObjectId[]) {
    try {
      for (const _id of fileIds) {
        const file = await this.fileModel.findOneAndDelete({ _id });
        this.deleteFile(file.Bucket, file.Key);
      }
      return ApiResponse.success('Files Deleted', HttpStatus.OK, null);
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }

  async fetchFile(
    fileId: Types.ObjectId,
    controller: boolean = false,
    name: string = 'File',
  ) {
    try {
      const file = await this.fileModel.findById(fileId);
      if (!file)
        return ApiResponse.fail(`${name} does not exist`, HttpStatus.NOT_FOUND);
      if (controller) {
        file.saved = true;
        await file.save();
      }
      return ApiResponse.success(name, HttpStatus.OK, file);
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }

  async fetchBackground() {
    try {
      const file = await this.fileModel
        .findOne({ logosBackGround: true })
        .select('url');
      if (!file) throw new Error('Background image has not been uploaded');
      return ApiResponse.success('Background image', HttpStatus.OK, file);
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }

  async controllerUploadFile(files: ExtendedFileType[]) {
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const validationResult = this.validateFile(file);
        if (!validationResult.status) return validationResult;
        file.type = validationResult.data.type;
        file.format = validationResult.data.format;
      }
      for (const file of files) {
        const { Key, url, Bucket } = await this.uploadFile(file);
        const { format, mimetype, originalname, type } = file;
        const createdFile = await this.fileModel.create({
          url,
          mimetype,
          Key,
          format,
          originalname,
          Bucket,
          saved: false,
          type,
          size: (file.size / 1024 / 1024).toFixed(3) + 'mb',
        });

        uploadedFiles.push({
          _id: createdFile._id,
          url: createdFile.url,
          originalname: createdFile.originalname,
        });
      }
      return ApiResponse.success(
        'Files Uploaded',
        HttpStatus.OK,
        uploadedFiles,
      );
    } catch (error) {
      return ApiResponse.fail(error.message);
    }
  }

  // @Cron(CronExpression.EVERY_WEEKEND)
  // async fileCleaner() {
  //   try {
  //     const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  //     const files = await this.fileModel
  //       .find({
  //         createdAt: { $lt: twoDaysAgo },
  //         saved: false,
  //       })
  //       .select('_id');
  //     const fileIds = files.map((file) => file._id);
  //     await this.deleteFiles(fileIds);
  //     console.log(`Junk cleaner just cleared ${files.length} files`);
  //   } catch (error) {
  //     console.log('Error deleting junk files');
  //   }
  // }
}