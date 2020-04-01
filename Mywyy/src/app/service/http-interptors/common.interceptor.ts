import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpEvent, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/internal/operators';

@Injectable()
export class CommonInterceptor implements HttpInterceptor {
    // 添加跨域cookie属性
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req.clone({
            withCredentials: true
        })).pipe(catchError(this.handleError));
    }

    // 筛选错误信息
    private handleError(error: HttpErrorResponse): never {
            throw error.error;
    }
}
