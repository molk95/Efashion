import { Pipe, PipeTransform, inject } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { PowerBiUrlService } from '../core/powerbi-url.service';

/**
 * Usage : <iframe [src]="dashboard.embedUrl | sanitizeEmbedUrl"></iframe>
 * Accepte un lien direct ou un snippet <iframe> complet.
 */
@Pipe({ name: 'sanitizeEmbedUrl', standalone: true })
export class SanitizeEmbedUrlPipe implements PipeTransform {
  private powerBi = inject(PowerBiUrlService);

  transform(value: string | null | undefined): SafeResourceUrl | null {
    return this.powerBi.toSafeUrl(value);
  }
}
