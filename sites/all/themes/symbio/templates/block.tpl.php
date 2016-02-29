<?php global $user;
	// Check to see if $user has the administrator role.
	if (in_array('administrator', array_values($user->roles))) { ?>
    <div id="<?php print $block_html_id; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>
    	<?php print render($title_suffix); ?>
<?php } ?>
  	<?php if ($content): ?>
	<?php print $content; ?>
	<?php endif; ?>
<?php global $user;
	// Check to see if $user has the administrator role.
	if (in_array('administrator', array_values($user->roles))) { ?>
    </div>
<?php } ?>