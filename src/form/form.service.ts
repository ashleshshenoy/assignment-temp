import { Injectable } from '@nestjs/common';
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
} from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable({})
export class FormService {
  async savePdf(fields: Record<string, any>): Promise<void> {
    const pdfPath = path.join(__dirname, '..', '..', 'client', 'example.pdf');
    try {
      const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
      const form = pdfDoc.getForm();

      for (const [key, value] of Object.entries(fields)) {
        const field = form.getField(key);
        if (field) {
          switch (field.constructor.name) {
            case 'PDFTextField':
              (field as PDFTextField).setFontSize(10);
              (field as PDFTextField).setText(value);
              break;
            case 'PDFCheckBox':
              value
                ? (field as PDFCheckBox).check()
                : (field as PDFCheckBox).uncheck();
              break;
            case 'PDFRadioGroup':
              if (value) {
                (field as PDFRadioGroup).select(value);
              }
              break;
            case 'PDFDropdown':
              (field as PDFDropdown).select(value);
              break;
          }
        }
      }
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(pdfPath, pdfBytes);
    } catch (error) {
      console.error(error);
      throw new Error('Error saving PDF');
    }
  }
}
