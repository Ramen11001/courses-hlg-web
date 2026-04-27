import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './cards-componet.html',
    styleUrls: ['./cards-componet.scss'],
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class HomeComponent {

    /**
  * Title for the card of the home view.
  */
    @Input() title!: string;

    /**
 * Description for the card of the home view.
 */
    @Input() description!: string;

    /**
 * Description for the card of the home view.
 */
    @Input() cost!: string;
 

    /**
 * Description for the card of the home view.
 */
    @Input() items!: [];


}