import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private cloudName = 'dzewdhtsv'; // Replace with your Cloudinary cloud name
  private uploadPreset = 'dzxm7rfx'; // Replace with your Cloudinary upload preset

  constructor(private http: HttpClient) {}

  uploadImage(file: File, username: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('public_id', username); // Use username as the public ID

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return this.http.post(url, formData);
  }
}
