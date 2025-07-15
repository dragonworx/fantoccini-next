import { Container } from '$core/ui/elements';
import { StackLayout } from '$core/ui/layouts';
import type { ContainerConfig } from '$core/ui/types';

export interface StackConfig extends ContainerConfig {
	direction?: 'horizontal' | 'vertical';
	spacing?: number;
}

export class Stack extends Container {
	constructor(config: StackConfig) {
		super({
			...config,
			layout: new StackLayout({
				direction: config.direction || 'vertical',
				spacing: config.spacing || 0
			})
		});
	}
}