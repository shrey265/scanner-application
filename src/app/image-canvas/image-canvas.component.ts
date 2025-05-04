import { CommonModule, NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { StorageService } from '../service/storage.service';

@Component({
  selector: 'app-image-canvas',
  standalone: true,
  imports: [CommonModule, NgStyle],
  templateUrl: './image-canvas.component.html',
  styleUrl: './image-canvas.component.scss'
})
export class ImageCanvasComponent implements AfterViewInit,OnInit, OnChanges{
  @ViewChild('canvas') canvas!: ElementRef;
  @Output('coords') coords: EventEmitter<any> = new EventEmitter();
  @Input('state') state: string = 'IDLE';
  @Input('shiftHistory') shiftHistory: any[] = [];
  @Input('scanHistory') scanHistory: any[] = [];

  // coords updated after each keypress
  mappings: any = {'x': 0, 'y': 0};

  // coordinates where box will appear
  finalCoords: any = {'x': 0, 'y': 0};

  // slide width and field width
  slideWidth: number = 0;
  slideHeight: number = 0;
  fieldWidth: number = 50;
  unitSizeX: number = 0;
  unitSizeY:  number = 0;

  // units moved in x and y directions
  units: any = {'x': 0, 'y':0};

  private storageService: StorageService = inject(StorageService);

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['state'] && changes['state'].currentValue!='MOVING') {
      this.finalCoords = this.mappings;
      if(this.mappings.x!=0 || this.mappings.y!=0){
        this.storageService.setItem("finalCoords", this.finalCoords);
        this.storageService.setItem("mappings", this.mappings);
      }
    } 
  }

  ngOnInit(): void {
    if(this.storageService.getItem("finalCoords")) this.finalCoords = this.storageService.getItem("finalCoords");
    if(this.storageService.getItem("mappings")) this.mappings = this.storageService.getItem("mappings");
  }

  ngAfterViewInit(): void {
    this.slideWidth = this.canvas.nativeElement.offsetWidth;
    this.slideHeight = this.canvas.nativeElement.offsetHeight;
    this.unitSizeX = (this.fieldWidth*100)/this.slideWidth;
    this.unitSizeY = (this.fieldWidth*100)/this.slideHeight;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 39) {
      if((this.mappings.x+this.unitSizeX)>=100) {this.mappings.x = 100-this.unitSizeX;return;}
      this.mappings.x = this.mappings.x + this.unitSizeX;
      this.units.x+=1;
    } else if (event.keyCode === 40) {
      if(this.mappings.y+this.unitSizeY>=100) {this.mappings.y = 100 - this.unitSizeY;return;}
      this.mappings.y = this.mappings.y +this.unitSizeY;
      this.units.y+=1;
    } else if (event.keyCode === 37) {
      if(this.mappings.x<=0) {this.mappings.x = 0;return;}
      this.mappings.x = this.mappings.x -1*this.unitSizeX;
      this.units.x-=1;
    } else if (event.keyCode === 38) {
      if(this.mappings.y<=0){this.mappings.y=0;return;}
      this.mappings.y = this.mappings.y -1*this.unitSizeY;
      this.units.y-=1;
    } else {
      return;
    }


    this.coords.emit({'unitX': this.units.x,'unitY': this.units.y, 'xCoord': this.mappings.x, 'yCoord': this.mappings.y});
  }

}
