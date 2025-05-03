import { CommonModule, NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-image-canvas',
  standalone: true,
  imports: [CommonModule, NgStyle],
  templateUrl: './image-canvas.component.html',
  styleUrl: './image-canvas.component.scss'
})
export class ImageCanvasComponent implements AfterViewInit, OnChanges{
  @ViewChild('canvas') canvas!: ElementRef;
  @Output('coords') coords: EventEmitter<any> = new EventEmitter();
  @Input('state') state: string = 'IDLE';

  Xcoord: number = 0;
  Ycoord: number = 0;
  Xfinal: number = 0;
  Yfinal: number = 0;
  slideWidth: number = 0;
  slideHeight: number = 0;
  fieldWidth: number = 50;
  unitSizeX: number = 0;
  unitSizeY:  number = 0;

  unitX: number = 0;
  unitY: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['state'] && changes['state'].currentValue!='MOVING') {
      this.Xfinal = this.Xcoord;
      this.Yfinal = this.Ycoord;
    }
  }

  ngAfterViewInit(): void {
    this.slideWidth = this.canvas.nativeElement.offsetWidth;
    this.slideHeight = this.canvas.nativeElement.offsetHeight;
    this.unitSizeX = (this.fieldWidth*100)/this.slideWidth;
    this.unitSizeY = (this.fieldWidth*100)/this.slideHeight;
    // console.log(this.slideHeight);
    // console.log(this.slideWidth);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 39) {
      if((this.Xcoord+this.unitSizeX)>=100) {this.Xcoord = 100-this.unitSizeX;return;}
      this.Xcoord = this.Xcoord + this.unitSizeX;
      this.unitX+=1;
    } else if (event.keyCode === 40) {
      if(this.Ycoord+this.unitSizeY>=100) {this.Ycoord = 100 - this.unitSizeY;return;}
      this.Ycoord = this.Ycoord +this.unitSizeY;
      this.unitY+=1;
    } else if (event.keyCode === 37) {
      if(this.Xcoord<=0) {this.Xcoord = 0;return;}
      this.Xcoord = this.Xcoord -1*this.unitSizeX;
      this.unitX-=1;
    } else if (event.keyCode === 38) {
      if(this.Ycoord<=0){this.Ycoord=0;return;}
      this.Ycoord = this.Ycoord -1*this.unitSizeY;
      this.unitY-=1;
    }

    this.coords.emit({'unitX': this.unitX,'unitY': this.unitY});
  }

}
