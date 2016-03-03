<!DOCTYPE html>
<html class="no-js" lang="<?php print $language->language ?>" dir="<?php print $language->dir ?>">
	<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="HandheldFriendly" content="true">
    <title><?php print $head_title; ?></title>
    <meta name="application-name" content="<?php print $site_name; ?>">
    <meta name="msapplication-TileColor" content="#ffffff">
	<meta name="msapplication-TileImage" content="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-270x270.png">
    <meta name="theme-color" content="#ffffff">
    <link rel="icon" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-192x192.png" sizes="192x192">
    <link rel="apple-touch-icon-precomposed" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/img/icons/icon-180x180.png">
		<?php print $head; ?>
		<?php
		  global $user;
		  // Check to see if $user has the administrator role.
		  if (in_array('administrator', array_values($user->roles))) {
		    print $styles;
		  }
		?>
	<link rel="stylesheet" href="<?php global $base_path; print $base_path; ?><?php print $directory; ?>/assets/css/app.css">
	</head>
	<body class="<?php print $classes; ?>" <?php print $attributes;?> itemscope itemtype="http://schema.org/WebPage">
		<?php include ($directory."/partials/svg.php"); ?>
		<div id="skip-link">
			<a href="#main-content" class="element-invisible element-focusable"><?php print t('Skip to main content'); ?></a>
		</div>
		<?php print $page_top; ?>
		<?php print $page; ?>
		<?php print $scripts; ?>
		<?php print $page_bottom; ?>
	</body>
</html>