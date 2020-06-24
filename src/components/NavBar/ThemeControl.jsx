import { Button, ButtonGroup } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { css } from 'linaria'
import React, { useState } from 'react'

export const ThemeControl = () => {
	const [selectedTheme, changeTheme] = useState('light')
	const isLightTheme = selectedTheme === 'light'

	return (
		<ButtonGroup
			className={css`
				margin-left: auto;
			`}
		>
			<Button
				active={isLightTheme}
				intent={isLightTheme ? 'primary' : 'none'}
				icon={IconNames.FLASH}
				onClick={() => changeTheme('light')}
			/>
			<Button
				active={!isLightTheme}
				intent={isLightTheme ? 'none' : 'primary'}
				icon={IconNames.MOON}
				onClick={() => changeTheme('dark')}
			/>
		</ButtonGroup>
	)
}