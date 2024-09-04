import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

import { BookDto } from '@/dto/book.dto';

import { BookService } from './book.service';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  async getAll() {
    return this.bookService.find({});
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Post()
  async create(@Body() book: BookDto) {
    return this.bookService.save(book);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() book: Partial<BookDto>) {
    return this.bookService.updateOne(id, book);
  }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.bookService.deleteOne(id);
  // }
}
