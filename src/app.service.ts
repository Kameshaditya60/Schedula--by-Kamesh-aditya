import { Injectable, OnModuleInit} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  onModuleInit() {
    if (this.dataSource.isInitialized) {
      console.log('✅ Database Connected Successfully!');
    } else {
      console.log('❌ Database Connection Failed!');
    }
  }
  getHomepage(): string {
    return 'Welcome to Schedula API! This is the default home page. Please use /hello to check if the API is working.';
  }
  hello(): string {
    return 'Hello World!, End Point is working successfully.';
  }
}
