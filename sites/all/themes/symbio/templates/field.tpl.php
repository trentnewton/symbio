<?php global $user;
    // Check to see if $user has the administrator role.
    if (in_array('administrator', array_values($user->roles))) { ?>
    <div class="<?php print $classes; ?>"<?php print $attributes; ?>>
<?php } ?>
<?php if (!$label_hidden): ?>
	<div class="field-label"<?php print $title_attributes; ?>><?php print $label ?>:&nbsp;</div>
<?php endif; ?>
<?php global $user;
    // Check to see if $user has the administrator role.
    if (in_array('administrator', array_values($user->roles))) { ?>
    <div class="field-items"<?php print $content_attributes; ?>>
<?php } ?>
<?php foreach ($items as $delta => $item): ?>
    <?php global $user;
    // Check to see if $user has the administrator role.
    if (in_array('administrator', array_values($user->roles))) { ?>
    <div class="field-item <?php print $delta % 2 ? 'odd' : 'even'; ?>"<?php print $item_attributes[$delta]; ?>>
    <?php } ?>
        <?php
			print render($item);
			// Add comma if not last item
			if ($delta < (count($items) - 1)) {
				print ',';
			}
		?>
	<?php global $user;
    // Check to see if $user has the administrator role.
    if (in_array('administrator', array_values($user->roles))) { ?>
    </div>
	<?php } ?>
<?php endforeach; ?>
<?php global $user;
    // Check to see if $user has the administrator role.
    if (in_array('administrator', array_values($user->roles))) { ?>
        </div>
    </div>
<?php } ?>