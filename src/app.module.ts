import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
    FormModule,
  ],
})
export class AppModule {}
