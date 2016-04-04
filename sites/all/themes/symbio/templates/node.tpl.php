<?php global $user;
	// Check to see if $user has the administrator role.
	if (in_array('administrator', array_values($user->roles))) { ?>
	<div id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?>"<?php print $attributes; ?>>
<?php } ?>
<?php print render($title_prefix); ?>
<?php if (!$page): ?>
	<h2<?php print $title_attributes; ?>><a href="<?php print $node_url; ?>"><?php print $title; ?></a></h2>
<?php endif; ?>
<?php print render($title_suffix); ?>
<?php print render($content); ?>
<?php global $user;
	// Check to see if $user has the administrator role.
	if (in_array('administrator', array_values($user->roles))) { ?>
	</div>
<?php } ?>