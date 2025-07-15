import { Element } from '$core/ui/elements';
import type { ElementConfig } from '$core/ui/types';

export interface RectangleConfig extends ElementConfig {
	backgroundColor?: string;
}

export class Rectangle extends Element {
	constructor(config: RectangleConfig) {
		super(config);
		if (config.backgroundColor) {
			this.backgroundColor = config.backgroundColor;
		}
	}
}