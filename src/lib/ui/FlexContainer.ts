import { Container } from '$core/ui/elements';
import { FlexLayout } from '$core/ui/layouts';
import type { ContainerConfig, FlexDirection, FlexAlign, FlexJustify } from '$core/ui/types';

export interface FlexContainerConfig extends ContainerConfig {
	direction?: FlexDirection;
	justifyContent?: FlexJustify;
	alignItems?: FlexAlign;
	gap?: number;
}

export class FlexContainer extends Container {
	constructor(config: FlexContainerConfig) {
		super({
			...config,
			layout: new FlexLayout({
				direction: config.direction || 'row',
				justifyContent: config.justifyContent || 'flex-start',
				alignItems: config.alignItems || 'flex-start',
				gap: config.gap || 0
			})
		});
	}
}