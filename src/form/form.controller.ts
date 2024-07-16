import { FormService } from './form.service';
import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Controller()
export class FormController {
  constructor(private formservice: FormService) {}

  @Get('health')
  healthcheck() {
    return 'heallo world 🚀';
  }

  @Post('savePdf')
  async savePdf(@Body() body: { fields: Record<string, any> }) {
    try {
      await this.formservice.savePdf(body.fields);
      return 'PDF saved successfully';
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
