/**
 * Absolute layout manager
 * @namespace core.ui
 * @memberof core.ui
 */

import type { ILayoutManager } from '../types';
import type { Container } from '../elements/container';

/**
 * Positions elements using absolute coordinates
 * @memberof core.ui
 */
export class AbsoluteLayout implements ILayoutManager {
	public name = 'absolute';

	/**
	 * Calculate layout - for absolute layout, children maintain their set positions
	 */
	public calculateLayout(_container: Container): void {
		// In absolute layout, elements are positioned exactly where they specify
		// No automatic positioning is done
		// This is useful for precise manual positioning
	}
}