declare module 'pdfkit' {
  import { Writable } from 'stream';

  interface PDFDocumentOptions {
    autoFirstPage?: boolean;
    bufferPages?: boolean;
    compress?: boolean;
    displayTitle?: boolean;
    info?: {
      Author?: string;
      CreationDate?: Date;
      Creator?: string;
      Keywords?: string;
      ModDate?: Date;
      Producer?: string;
      Subject?: string;
      Title?: string;
    };
    layout?: 'portrait' | 'landscape';
    margin?: number;
    margins?: {
      bottom?: number;
      left?: number;
      right?: number;
      top?: number;
    };
    permissions?: object;
    pdfVersion?: string;
    size?: string | [number, number];
    userPassword?: string;
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFDocumentOptions);
    
    addPage(options?: any): this;
    end(): void;
    
    fontSize(size: number): this;
    font(src: string, size?: number): this;
    fillColor(color: string, opacity?: number): this;
    strokeColor(color: string, opacity?: number): this;
    
    text(text: string, x?: number, y?: number, options?: any): this;
    moveDown(lines?: number): this;
    
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    
    image(src: string | Buffer, x?: number, y?: number, options?: any): this;
    
    page: {
      width: number;
      height: number;
    };
    
    x: number;
    y: number;
    
    on(event: string, callback: (...args: any[]) => void): this;
  }

  export = PDFDocument;
}
